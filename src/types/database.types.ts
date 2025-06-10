// Basic database types to resolve import errors
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
  };
};

// Brand type for strongly typed IDs
export type Brand<T, U> = T & { readonly __brand: U };

// Export for compatibility
export default Database;
