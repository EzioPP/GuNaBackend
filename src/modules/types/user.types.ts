export type User = {
  userId: number;
  name: string;
  username: string;
  password: string;
  createdAt: Date;
  permission: number;
};

export type UserCreateInput = {
  name: string;
  username: string;
  password: string;
  permission: number;
};
