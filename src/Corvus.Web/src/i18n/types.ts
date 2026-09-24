import type { en } from './en';

export type Language = 'en' | 'tr';

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type TranslationDictionary = DeepStringify<typeof en>;

// Helper to extract nested keys as dot notation: 'dashboard.title' | 'common.refresh'
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof en>;
