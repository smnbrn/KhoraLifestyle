// Tipo di ritorno uniforme per tutte le Server Action (sezione 2.4
// dell'architettura): mai eccezioni non gestite verso il client.
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
