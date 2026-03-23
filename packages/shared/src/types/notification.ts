export type PushPlatform = 'web' | 'android' | 'ios' | 'desktop';

export interface PushToken {
  id: string;
  userId: string;
  platform: PushPlatform;
  token: string;
  createdAt: string;
}

export interface RegisterPushTokenDto {
  platform: PushPlatform;
  token: string;
}
