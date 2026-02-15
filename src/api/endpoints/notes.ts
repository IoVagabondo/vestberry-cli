import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

interface NotesResponse {
  notes: Array<Record<string, unknown>>;
}

interface NoteMutationResponse {
  addNote?: Record<string, unknown>;
  editNote?: Record<string, unknown>;
}

export interface NotesFilter {
  companyId?: string;
  fundId?: string;
  limit?: number;
  offset?: number;
}

export async function listNotes(
  client: AxiosInstance,
  filter: NotesFilter,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query Notes($input: NoteSearch!) {
      notes(input: $input) {
        id
        headline
        noteText
        createdAt
        editedAt
        author { id email firstName lastName }
        portfolioCompany { id displayName }
        portfolioFund { id displayName }
      }
    }
  `;

  const filterInput: Record<string, unknown> = {};
  if (filter.companyId) {
    filterInput.portfolioCompany = { id: filter.companyId };
  }
  if (filter.fundId) {
    filterInput.portfolioFund = { id: filter.fundId };
  }

  const input: Record<string, unknown> = { filter: filterInput };
  if (filter.limit !== undefined || filter.offset !== undefined) {
    input.sort = [];
  }

  const data = await executeGraphQL<NotesResponse>(
    client,
    { query, variables: { input } },
    verbose,
  );
  return data.notes ?? [];
}

export async function createNote(
  client: AxiosInstance,
  input: Record<string, unknown>,
  verbose = false,
): Promise<Record<string, unknown>> {
  const query = `
    mutation AddNote($input: AddNoteInput!) {
      addNote(input: $input) {
        id
        headline
        createdAt
        editedAt
      }
    }
  `;

  const data = await executeGraphQL<NoteMutationResponse>(
    client,
    { query, variables: { input } },
    verbose,
  );

  return data.addNote ?? {};
}

export async function updateNote(
  client: AxiosInstance,
  id: string,
  input: Record<string, unknown>,
  verbose = false,
): Promise<Record<string, unknown>> {
  const query = `
    mutation EditNote($input: EditNoteInput!) {
      editNote(input: $input) {
        id
        headline
        editedAt
      }
    }
  `;

  const data = await executeGraphQL<NoteMutationResponse>(
    client,
    { query, variables: { input: { id, ...input } } },
    verbose,
  );

  return data.editNote ?? {};
}
