export type DisableTypeScript = any;

export type UnknownObject = Record<string, DisableTypeScript>;

export enum MethodType {
  Get = 'GET',
  Post = 'POST',
  Patch = 'PATCH',
  Delete = 'DELETE',
}
