import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  FileDown,
  Plus,
  X,
  Copy,
} from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { clsx } from 'clsx';
import { format, isBefore, isAfter, isSameDay } from 'date-fns';
import { useReminders } from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import Sidebar from '@/components/Sidebar';
import type { Reminder, Category, CompletionRecord, Subtask } from '@wiwf/shared';

// ─── Query Builder Types ─────────────────────────────────────────────

/** Fields the user can filter on */
type FilterField = 'name' | 'category' | 'subtask' | 'notes' | 'status' | 'priority' | 'date';

/** Operators available per field type */
type TextOp = 'contains' | 'equals' | 'starts_with' | 'not_contains';
type ChoiceOp = 'equals' | 'not_equals';
type DateOp = 'on' | 'before' | 'after' | 'between' | 'not_on' | 'not_between';
type FilterOp = TextOp | ChoiceOp | DateOp;

/** A single filter condition */
interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOp;
  value: string;
  /** Second value for "between" date operator */
  value2?: string;
}

/** A group of conditions joined by AND. Groups are joined by OR. */
interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

/** Operators available for each field type */
const TEXT_OPERATORS: Array<{ value: TextOp; label: string }> = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'not_contains', label: 'does not contain' },
];
const CHOICE_OPERATORS: Array<{ value: ChoiceOp; label: string }> = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
];
const DATE_OPERATORS: Array<{ value: DateOp; label: string }> = [
  { value: 'on', label: 'on' },
  { value: 'before', label: 'before' },
  { value: 'after', label: 'after' },
  { value: 'between', label: 'between' },
  { value: 'not_on', label: 'not on' },
  { value: 'not_between', label: 'not between' },
];

const FIELD_OPTIONS: Array<{ value: FilterField; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'subtask', label: 'Subtask' },
  { value: 'notes', label: 'Notes' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'date', label: 'Date' },
];

const STATUS_OPTIONS = ['active', 'paused', 'completed', 'archived'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low', 'info'];

function newCondition(): FilterCondition {
  return { id: crypto.randomUUID(), field: 'name', operator: 'contains', value: '' };
}
function newGroup(): FilterGroup {
  return { id: crypto.randomUUID(), conditions: [newCondition()] };
}

// ─── Report Row Type ─────────────────────────────────────────────────

interface ReportRow {
  key: string;
  reminder: Reminder;
  completion?: CompletionRecord;
  date: string;
  rowType: 'current' | 'history';
}

// ─── Component ───────────────────────────────────────────────────────

export default function ReportPage() {
  const navigate = useNavigate();
  const { data: allReminders } = useReminders();
  const { data: categories } = useCategories();

  // Advanced filter state: array of OR groups
  const [groups, setGroups] = useState<FilterGroup[]>([newGroup()]);
  const [expandHistory, setExpandHistory] = useState(true);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const catMap = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  // Category name lookup for filter matching
  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name.toLowerCase());
    return m;
  }, [categories]);

  // ── Group/Condition CRUD ───────────────────────────────────────────

  const addGroup = () => setGroups([...groups, newGroup()]);

  const removeGroup = (gid: string) => {
    const updated = groups.filter((g) => g.id !== gid);
    setGroups(updated.length > 0 ? updated : [newGroup()]);
  };

  const duplicateGroup = (gid: string) => {
    const src = groups.find((g) => g.id === gid);
    if (!src) return;
    const dup: FilterGroup = {
      id: crypto.randomUUID(),
      conditions: src.conditions.map((c) => ({ ...c, id: crypto.randomUUID() })),
    };
    setGroups([...groups, dup]);
  };

  const addCondition = (gid: string) => {
    setGroups(
      groups.map((g) =>
        g.id === gid ? { ...g, conditions: [...g.conditions, newCondition()] } : g,
      ),
    );
  };

  const removeCondition = (gid: string, cid: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== gid) return g;
        const updated = g.conditions.filter((c) => c.id !== cid);
        return { ...g, conditions: updated.length > 0 ? updated : [newCondition()] };
      }),
    );
  };

  const updateCondition = (gid: string, cid: string, patch: Partial<FilterCondition>) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== gid) return g;
        return {
          ...g,
          conditions: g.conditions.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
        };
      }),
    );
  };

  const clearAll = () => setGroups([newGroup()]);

  /** Check if there are any active filters (non-empty values) */
  const hasActiveFilters = groups.some((g) => g.conditions.some((c) => c.value.trim() !== ''));

  // ── Filter Evaluation ──────────────────────────────────────────────

  /** Test a single condition against a reminder */
  const testCondition = useCallback(
    (c: FilterCondition, r: Reminder): boolean => {
      const val = c.value.trim().toLowerCase();
      if (!val && c.field !== 'date') return true; // empty = no filter

      switch (c.field) {
        case 'name':
          return testText(r.name, c.operator as TextOp, val);
        case 'notes':
          return testText(r.notes ?? '', c.operator as TextOp, val);
        case 'subtask':
          return r.subtasks.some((s) => testText(s.title, c.operator as TextOp, val));
        case 'category': {
          const catName = catNameById.get(r.categoryId) ?? '';
          if (c.operator === 'not_equals') return catName !== val;
          return catName === val;
        }
        case 'status': {
          if (c.operator === 'not_equals') return r.status !== val;
          return r.status === val;
        }
        case 'priority': {
          if (c.operator === 'not_equals') return r.priority !== val;
          return r.priority === val;
        }
        case 'date': {
          if (!c.value) return true;
          const refDate = r.nextTriggerAt ? new Date(r.nextTriggerAt) : new Date(r.createdAt);
          const target = new Date(c.value + 'T00:00:00');
          switch (c.operator as DateOp) {
            case 'on':
              return isSameDay(refDate, target);
            case 'not_on':
              return !isSameDay(refDate, target);
            case 'before':
              return isBefore(refDate, target);
            case 'after':
              return isAfter(refDate, new Date(c.value + 'T23:59:59'));
            case 'between': {
              if (!c.value2) return true;
              const end = new Date(c.value2 + 'T23:59:59');
              return !isBefore(refDate, target) && !isAfter(refDate, end);
            }
            case 'not_between': {
              if (!c.value2) return true;
              const end = new Date(c.value2 + 'T23:59:59');
              return isBefore(refDate, target) || isAfter(refDate, end);
            }
            default:
              return true;
          }
        }
        default:
          return true;
      }
    },
    [catNameById],
  );

  /** Evaluate all groups (OR between groups, AND within group) */
  const rows = useMemo(() => {
    let reminders = [...allReminders];

    if (hasActiveFilters) {
      reminders = reminders.filter((r) =>
        // OR: at least one group must fully match
        groups.some((g) =>
          // AND: every condition in the group must match
          g.conditions.every((c) => testCondition(c, r)),
        ),
      );
    }

    const result: ReportRow[] = [];
    for (const r of reminders) {
      result.push({
        key: r.id,
        reminder: r,
        date: r.nextTriggerAt || r.createdAt,
        rowType: 'current',
      });

      if (expandHistory && r.completionHistory.length > 0) {
        for (const c of r.completionHistory) {
          result.push({
            key: `${r.id}-${c.id}`,
            reminder: r,
            completion: c,
            date: c.completedAt,
            rowType: 'history',
          });
        }
      }
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [allReminders, groups, expandHistory, hasActiveFilters, testCondition]);

  const filteredReminders = new Set(rows.map((r) => r.reminder.id)).size;

  /** Build structured data for a single report row */
  const buildRowData = (row: ReportRow) => {
    const r = row.reminder;
    const cat = r.categoryId ? (catMap.get(r.categoryId)?.name ?? '') : '';
    const isHist = row.rowType === 'history';
    const c = row.completion;
    const subs: Subtask[] = isHist && c ? c.subtaskSnapshot : r.subtasks;
    return {
      type: isHist ? (c?.action ?? 'history') : 'Current',
      name: r.name,
      status: isHist ? (c?.action ?? '') : r.status,
      priority: r.priority,
      category: cat,
      date:
        isHist && c
          ? format(new Date(c.completedAt), 'yyyy-MM-dd HH:mm')
          : r.nextTriggerAt
            ? format(new Date(r.nextTriggerAt), 'yyyy-MM-dd HH:mm')
            : format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm'),
      dateLabel: isHist ? 'Completed' : r.nextTriggerAt ? 'Next Due' : 'Created',
      notes: isHist ? '' : (r.notes ?? ''),
      subtasksText: subs
        .map((s) => `${s.isCompleted ? '[Done]' : '[Todo]'} ${s.title}`)
        .join(' | '),
      subtaskProgress:
        subs.length > 0 ? `${subs.filter((s) => s.isCompleted).length}/${subs.length} done` : '',
      created: format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm'),
    };
  };

  /** Export formatted plain text */
  const exportText = async () => {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm');
    const lines: string[] = [
      '============================================================',
      '            WIWF - TASK REPORT',
      `  Generated: ${now}`,
      `  Entries:   ${rows.length}`,
      '============================================================',
      '',
    ];
    for (const row of rows) {
      const d = buildRowData(row);
      lines.push('------------------------------------------------------------');
      lines.push(`  ${d.type.toUpperCase()} | ${d.name}`);
      lines.push(
        `  Status: ${d.status}  |  Priority: ${d.priority}  |  Category: ${d.category || '-'}`,
      );
      lines.push(`  ${d.dateLabel}: ${d.date}`);
      if (d.notes) lines.push(`  Notes: ${d.notes}`);
      if (d.subtasksText) lines.push(`  Subtasks (${d.subtaskProgress}): ${d.subtasksText}`);
      lines.push('');
    }
    lines.push('============================================================');
    lines.push('  End of Report');
    const ok = await downloadFile(
      lines.join('\n'),
      `WIWF_Report_${format(new Date(), 'yyyy-MM-dd')}.txt`,
      'text/plain',
    );
    setExportStatus(ok ? 'success' : 'error');
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  /** Export CSV — each subtask gets its own pair of columns (Title + Status) */
  const exportCSV = async () => {
    // Find max subtask count across all rows to create enough columns
    const maxSubs = rows.reduce((max, row) => {
      const isHist = row.rowType === 'history';
      const subs =
        isHist && row.completion ? row.completion.subtaskSnapshot : row.reminder.subtasks;
      return Math.max(max, subs.length);
    }, 0);

    // Build headers: fixed columns + dynamic subtask columns
    const fixedHeaders = [
      'Entry Type',
      'Reminder Name',
      'Status',
      'Priority',
      'Category',
      'Date',
      'Date Type',
      'Notes',
      'Subtask Progress',
      'Created Date',
    ];
    const subtaskHeaders: string[] = [];
    for (let i = 1; i <= maxSubs; i++) {
      subtaskHeaders.push(`Subtask ${i}`, `Subtask ${i} Status`);
    }
    const headers = [...fixedHeaders, ...subtaskHeaders];

    // Build data rows
    const csvRows = rows.map((row) => {
      const d = buildRowData(row);
      const isHist = row.rowType === 'history';
      const subs =
        isHist && row.completion ? row.completion.subtaskSnapshot : row.reminder.subtasks;

      const fixedCols = [
        d.type,
        d.name,
        d.status,
        d.priority,
        d.category,
        d.date,
        d.dateLabel,
        d.notes,
        d.subtaskProgress,
        d.created,
      ];

      // Fill subtask columns — each subtask gets Title + Done/Todo
      const subtaskCols: string[] = [];
      for (let i = 0; i < maxSubs; i++) {
        if (i < subs.length) {
          subtaskCols.push(subs[i]!.title, subs[i]!.isCompleted ? 'Done' : 'Todo');
        } else {
          subtaskCols.push('', '');
        }
      }

      return [...fixedCols, ...subtaskCols].map(csvEscape).join(',');
    });

    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...csvRows].join('\n');
    const ok = await downloadFile(
      csv,
      `WIWF_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      'text/csv;charset=utf-8',
    );
    setExportStatus(ok ? 'success' : 'error');
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  /**
   * Export PDF — saves a styled HTML report file, then opens it in the
   * default browser where the user can Cmd+P / Ctrl+P to print or save as PDF.
   * Tauri's WebView doesn't support window.print(), so we save + open instead.
   */
  const exportPDF = async () => {
    const now = format(new Date(), 'MMMM d, yyyy h:mm a');
    const tableRows = rows
      .map((row) => {
        const d = buildRowData(row);
        const isHist = row.rowType === 'history';
        const subs =
          isHist && row.completion ? row.completion.subtaskSnapshot : row.reminder.subtasks;
        const pColor =
          d.priority === 'high'
            ? '#ef4444'
            : d.priority === 'medium'
              ? '#6366f1'
              : d.priority === 'low'
                ? '#f59e0b'
                : '#9ca3af';
        const sColor = isHist
          ? d.status === 'completed'
            ? '#059669'
            : d.status === 'skipped'
              ? '#d97706'
              : '#2563eb'
          : '#6366f1';
        const subsHtml = subs
          .map(
            (s) =>
              '<div style="padding:1px 0;color:' +
              (s.isCompleted ? '#059669' : '#374151') +
              '">' +
              (s.isCompleted ? '&#10003; <s>' : '&#9675; ') +
              escapeHtml(s.title) +
              (s.isCompleted ? '</s>' : '') +
              '</div>',
          )
          .join('');
        return (
          '<tr>' +
          '<td><b style="color:' +
          sColor +
          ';font-size:10px">' +
          escapeHtml(d.type.toUpperCase()) +
          '</b></td>' +
          '<td style="font-weight:600">' +
          escapeHtml(d.name) +
          '</td>' +
          '<td style="color:' +
          sColor +
          '">' +
          escapeHtml(d.status) +
          '</td>' +
          '<td style="color:' +
          pColor +
          ';font-weight:500">' +
          escapeHtml(d.priority) +
          '</td>' +
          '<td>' +
          (escapeHtml(d.category) || '-') +
          '</td>' +
          '<td style="white-space:nowrap"><div style="color:#888;font-size:10px">' +
          escapeHtml(d.dateLabel) +
          '</div>' +
          escapeHtml(d.date) +
          '</td>' +
          '<td style="max-width:180px;font-size:11px">' +
          (d.notes ? escapeHtml(d.notes).substring(0, 150) : '') +
          '</td>' +
          '<td style="font-size:11px">' +
          (subsHtml || '-') +
          (d.subtaskProgress
            ? '<div style="font-size:10px;color:#888;margin-top:2px">' +
              escapeHtml(d.subtaskProgress) +
              '</div>'
            : '') +
          '</td>' +
          '</tr>'
        );
      })
      .join('\n');

    const htmlStr = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>WIWF Report</title><style>',
      '* { margin:0; padding:0; box-sizing:border-box; }',
      'body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; font-size:12px; color:#1f2937; padding:40px; }',
      '.hdr { margin-bottom:24px; border-bottom:3px solid #6366f1; padding-bottom:16px; }',
      '.hdr h1 { font-size:22px; color:#6366f1; margin-bottom:4px; }',
      '.hdr p { font-size:11px; color:#6b7280; }',
      '.hint { background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 14px; margin-bottom:20px; font-size:11px; color:#4338ca; }',
      'table { width:100%; border-collapse:collapse; font-size:11px; }',
      'th { background:#f3f4f6; text-align:left; padding:8px 10px; font-size:9px; text-transform:uppercase; letter-spacing:.5px; color:#6b7280; border-bottom:2px solid #e5e7eb; }',
      'td { padding:8px 10px; border-bottom:1px solid #f0f0f0; vertical-align:top; }',
      'tr:nth-child(even) { background:#fafafa; }',
      '.ft { margin-top:24px; padding-top:12px; border-top:1px solid #e5e7eb; font-size:10px; color:#9ca3af; text-align:center; }',
      '@media print { .hint { display:none; } body { padding:16px; } }',
      '</style></head><body>',
      '<div class="hdr"><h1>What I Would Forget - Task Report</h1>',
      '<p>Generated: ' +
        escapeHtml(now) +
        ' &middot; ' +
        rows.length +
        ' entries from ' +
        filteredReminders +
        ' reminders</p></div>',
      '<div class="hint">To save as PDF: Press <b>Cmd+P</b> (Mac) or <b>Ctrl+P</b> (Windows/Linux), then choose "Save as PDF" as the destination.</div>',
      '<table><thead><tr><th>Type</th><th>Name</th><th>Status</th><th>Priority</th><th>Category</th><th>Date</th><th>Notes</th><th>Subtasks</th></tr></thead><tbody>',
      tableRows,
      '</tbody></table>',
      '<div class="ft">WIWF v1.0.0 &middot; Local-first Reminder App</div>',
      '</body></html>',
    ].join('\n');

    // Save the HTML file via Tauri dialog, then open it in the default browser
    const ok = await downloadFile(
      htmlStr,
      `WIWF_Report_${format(new Date(), 'yyyy-MM-dd')}.html`,
      'text/html',
    );
    if (ok) {
      setExportStatus('success');
      // The file is saved — user can open it in their browser to print/save as PDF
    } else {
      setExportStatus('error');
    }
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Reports & Export
            </h1>
            <div className="flex items-center gap-2">
              {exportStatus === 'success' && (
                <span className="text-xs text-emerald-600 font-medium">Saved!</span>
              )}
              {exportStatus === 'error' && (
                <span className="text-xs text-red-500 font-medium">Failed</span>
              )}
              <button type="button" onClick={exportText} className="btn-secondary gap-1.5 text-sm">
                <FileText size={14} />
                Export TXT
              </button>
              <button type="button" onClick={exportCSV} className="btn-primary gap-1.5 text-sm">
                <FileSpreadsheet size={14} />
                Export CSV
              </button>
              <button type="button" onClick={exportPDF} className="btn-secondary gap-1.5 text-sm">
                <FileDown size={14} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Advanced Query Builder */}
          <div className="card p-4 mb-6 space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Search size={14} className="inline mr-1.5 -mt-0.5" />
                Advanced Search
              </h2>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs hover:opacity-80"
                    style={{ color: 'var(--accent)' }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Filter groups — OR between groups */}
            {groups.map((group, gi) => (
              <div key={group.id}>
                {gi > 0 && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      OR
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                  </div>
                )}
                <div
                  className="rounded-soft p-3 space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Conditions within group — AND */}
                  {group.conditions.map((cond, ci) => (
                    <div key={cond.id}>
                      {ci > 0 && (
                        <div
                          className="text-xs font-medium pl-2 py-0.5"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          AND
                        </div>
                      )}
                      <ConditionRow
                        condition={cond}
                        categories={categories}
                        onChange={(patch) => updateCondition(group.id, cond.id, patch)}
                        onRemove={() => removeCondition(group.id, cond.id)}
                      />
                    </div>
                  ))}
                  {/* Group actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => addCondition(group.id)}
                      className="text-xs font-medium flex items-center gap-1 hover:opacity-80"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Plus size={12} /> Add AND condition
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateGroup(group.id)}
                      className="text-xs flex items-center gap-1 hover:opacity-80"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Copy size={11} /> Duplicate group
                    </button>
                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGroup(group.id)}
                        className="text-xs text-red-400 flex items-center gap-1 hover:opacity-80 ml-auto"
                      >
                        <X size={12} /> Remove group
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add OR group */}
            <button
              type="button"
              onClick={addGroup}
              className="text-xs font-medium flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              <Plus size={12} /> Add OR group
            </button>

            {/* Footer: count + history toggle */}
            <div
              className="flex items-center justify-between pt-1"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {rows.length} entries from {filteredReminders} reminders
              </span>
              <label
                className="flex items-center gap-2 text-xs cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <input
                  type="checkbox"
                  checked={expandHistory}
                  onChange={(e) => setExpandHistory(e.target.checked)}
                  className="rounded"
                />
                Show completions separately
              </label>
            </div>
          </div>

          {/* Results — each row is clickable */}
          <div className="space-y-2">
            {rows.map((row) => (
              <ReportRowCard
                key={row.key}
                row={row}
                catMap={catMap}
                onClick={() => navigate(`/reminders/${row.reminder.id}`)}
              />
            ))}

            {rows.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                <p className="text-sm">No entries match your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Text matching helper ────────────────────────────────────────────

function testText(haystack: string, op: TextOp, needle: string): boolean {
  const h = haystack.toLowerCase();
  switch (op) {
    case 'contains':
      return h.includes(needle);
    case 'equals':
      return h === needle;
    case 'starts_with':
      return h.startsWith(needle);
    case 'not_contains':
      return !h.includes(needle);
    default:
      return true;
  }
}

// ─── Condition Row Component ─────────────────────────────────────────

function ConditionRow({
  condition: c,
  categories,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  categories: Category[];
  onChange: (patch: Partial<FilterCondition>) => void;
  onRemove: () => void;
}) {
  const isTextField = c.field === 'name' || c.field === 'notes' || c.field === 'subtask';
  const isDateField = c.field === 'date';

  const operators = isTextField ? TEXT_OPERATORS : isDateField ? DATE_OPERATORS : CHOICE_OPERATORS;

  // Reset operator when field changes to avoid invalid combos
  const handleFieldChange = (field: FilterField) => {
    const newOp =
      field === 'date'
        ? 'after'
        : field === 'name' || field === 'notes' || field === 'subtask'
          ? 'contains'
          : 'equals';
    onChange({ field, operator: newOp as FilterOp, value: '', value2: undefined });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field selector */}
      <select
        value={c.field}
        onChange={(e) => handleFieldChange(e.target.value as FilterField)}
        className="input-field text-xs w-28"
      >
        {FIELD_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={c.operator}
        onChange={(e) => onChange({ operator: e.target.value as FilterOp })}
        className="input-field text-xs w-32"
      >
        {operators.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Value input — varies by field type */}
      {isTextField && (
        <input
          type="text"
          value={c.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Enter text..."
          className="input-field text-xs flex-1 min-w-[120px]"
        />
      )}

      {c.field === 'category' && (
        <select
          value={c.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="input-field text-xs flex-1 min-w-[120px]"
        >
          <option value="">Select...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name.toLowerCase()}>
              {cat.name}
            </option>
          ))}
        </select>
      )}

      {c.field === 'status' && (
        <select
          value={c.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="input-field text-xs flex-1 min-w-[120px]"
        >
          <option value="">Select...</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {c.field === 'priority' && (
        <select
          value={c.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="input-field text-xs flex-1 min-w-[120px]"
        >
          <option value="">Select...</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}

      {isDateField && (
        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            type="date"
            value={c.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className="input-field text-xs flex-1"
          />
          {(c.operator === 'between' || c.operator === 'not_between') && (
            <>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                to
              </span>
              <input
                type="date"
                value={c.value2 ?? ''}
                onChange={(e) => onChange({ value2: e.target.value })}
                className="input-field text-xs flex-1"
              />
            </>
          )}
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
      >
        <X size={14} className="text-red-400" />
      </button>
    </div>
  );
}

// ─── Report Row Card ─────────────────────────────────────────────────

/** Individual clickable report row */
function ReportRowCard({
  row,
  catMap,
  onClick,
}: {
  row: ReportRow;
  catMap: Map<string, Category>;
  onClick: () => void;
}) {
  const r = row.reminder;
  const cat = r.categoryId ? catMap.get(r.categoryId) : undefined;
  const isHistory = row.rowType === 'history';
  const completion = row.completion;

  /** Subtasks to display: snapshot for history, live for current */
  const subtasks: Subtask[] = isHistory && completion ? completion.subtaskSnapshot : r.subtasks;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'card-hover w-full text-left p-4 animate-slide-up cursor-pointer',
        isHistory && 'border-l-4',
        isHistory && completion?.action === 'completed' && 'border-l-emerald-500',
        isHistory && completion?.action === 'skipped' && 'border-l-amber-500',
        isHistory && completion?.action === 'snoozed' && 'border-l-blue-500',
        !isHistory && 'border-l-4 border-l-indigo-500',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* History badge */}
            {isHistory && completion && (
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                  completion.action === 'completed' && 'bg-emerald-100 text-emerald-700',
                  completion.action === 'skipped' && 'bg-amber-100 text-amber-700',
                  completion.action === 'snoozed' && 'bg-blue-100 text-blue-700',
                )}
              >
                {completion.action}
              </span>
            )}

            {/* Current status badge */}
            {!isHistory && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-indigo-100 text-indigo-700">
                {r.status}
              </span>
            )}

            {/* Category */}
            {cat && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: cat.color + '20', color: cat.color }}
              >
                {cat.name}
              </span>
            )}

            {/* Priority */}
            <span
              className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                r.priority === 'high' && 'bg-red-100 text-red-700',
                r.priority === 'medium' && 'bg-indigo-50 text-indigo-600',
                r.priority === 'low' && 'bg-amber-50 text-amber-600',
                r.priority === 'info' && 'bg-gray-100 text-gray-500',
              )}
            >
              {r.priority}
            </span>
          </div>

          {/* Name */}
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {r.name}
          </h3>

          {/* Date */}
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isHistory && completion
              ? `${completion.action === 'completed' ? 'Completed' : completion.action === 'skipped' ? 'Skipped' : 'Snoozed'}: ${format(new Date(completion.completedAt), 'MMM d, yyyy h:mm a')}`
              : r.nextTriggerAt
                ? `Next: ${format(new Date(r.nextTriggerAt), 'MMM d, yyyy h:mm a')}`
                : `Created: ${format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}`}
          </p>

          {/* Notes (current only) */}
          {!isHistory && r.notes && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
              Notes: {r.notes}
            </p>
          )}

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {subtasks.map((s, i) => (
                <div
                  key={s.id || i}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className={s.isCompleted ? 'text-emerald-500' : ''}>
                    {s.isCompleted ? '✓' : '○'}
                  </span>
                  <span className={s.isCompleted ? 'line-through' : ''}>{s.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Click indicator */}
        <ChevronRight
          size={16}
          className="flex-shrink-0 mt-1 opacity-40"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    </button>
  );
}

/** Escape HTML special characters to prevent injection in PDF export */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Save a file using Tauri's native save dialog.
 * Falls back to browser download if Tauri is unavailable.
 */
async function downloadFile(
  content: string,
  filename: string,
  _mimeType: string,
): Promise<boolean> {
  try {
    // Determine file extension for the dialog filter
    const ext = filename.split('.').pop() ?? 'txt';
    const filterName = ext === 'csv' ? 'CSV' : 'Text';

    const filePath = await save({
      title: `Save Report as ${ext.toUpperCase()}`,
      defaultPath: filename,
      filters: [{ name: filterName, extensions: [ext] }],
    });

    if (!filePath) return false; // User cancelled

    await writeTextFile(filePath, content);
    return true;
  } catch (err) {
    console.error('Export failed:', err);
    // Fallback: try browser download
    try {
      const blob = new Blob([content], { type: _mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
