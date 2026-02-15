import type { Command } from 'commander';
import { createNote, listNotes, updateNote } from '../api/endpoints/notes';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';
import { parseJsonInput } from '../utils/parse-json';
import { writeRunLog } from '../utils/run-log';

export function registerNoteCommand(program: Command): void {
  const cmd = program.command('note').description('Note commands');

  cmd
    .command('list')
    .option('--company-id <id>', 'Portfolio company ID filter')
    .option('--fund-id <id>', 'Fund ID filter')
    .option('--all', 'Return all available rows', false)
    .description('List notes')
    .action(async function action(options: { companyId?: string; fundId?: string; all?: boolean }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listNotes(
          client,
          {
            ...(options.companyId !== undefined ? { companyId: options.companyId } : {}),
            ...(options.fundId !== undefined ? { fundId: options.fundId } : {}),
          },
          config.verbose,
        );
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('create')
    .requiredOption('--data <json|@file>', 'AddNoteInput JSON payload')
    .option('--apply', 'Execute mutation (otherwise dry-run)', false)
    .option('--dry-run', 'Force dry-run', true)
    .description('Create note (dry-run by default)')
    .action(async function action(options: { data: string; apply?: boolean; dryRun?: boolean }) {
      try {
        const { client, config } = getCommandContext(this);
        const payload = (await parseJsonInput<Record<string, unknown>>(options.data)) ?? {};
        const shouldApply = Boolean(options.apply) && !Boolean(options.dryRun) && !config.dryRun;

        if (!shouldApply) {
          const log = await writeRunLog({ action: 'note.create', dryRun: true, payload });
          printData({ dryRun: true, action: 'note.create', payload, log }, config);
          return;
        }

        const created = await createNote(client, payload, config.verbose);
        const companyId = (payload.portfolioCompany as { id?: string } | undefined)?.id;
        const fundId = (payload.portfolioFund as { id?: string } | undefined)?.id;
        const verify = await listNotes(
          client,
          {
            ...(companyId !== undefined ? { companyId } : {}),
            ...(fundId !== undefined ? { fundId } : {}),
          },
          config.verbose,
        );

        const log = await writeRunLog({
          action: 'note.create',
          dryRun: false,
          payload,
          created,
          verificationCount: verify.length,
        });

        printData({ created, verificationCount: verify.length, log }, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('update <id>')
    .requiredOption('--data <json|@file>', 'EditNoteInput partial JSON payload')
    .option('--apply', 'Execute mutation (otherwise dry-run)', false)
    .option('--dry-run', 'Force dry-run', true)
    .description('Update note (dry-run by default)')
    .action(async function action(
      id: string,
      options: { data: string; apply?: boolean; dryRun?: boolean },
    ) {
      try {
        const { client, config } = getCommandContext(this);
        const payload = (await parseJsonInput<Record<string, unknown>>(options.data)) ?? {};
        const shouldApply = Boolean(options.apply) && !Boolean(options.dryRun) && !config.dryRun;

        if (!shouldApply) {
          const log = await writeRunLog({ action: 'note.update', dryRun: true, id, payload });
          printData({ dryRun: true, action: 'note.update', id, payload, log }, config);
          return;
        }

        const updated = await updateNote(client, id, payload, config.verbose);

        const log = await writeRunLog({
          action: 'note.update',
          dryRun: false,
          id,
          payload,
          updated,
        });

        printData({ updated, log }, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
