import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { ExportData } from '../../domain';

/**
 * "Exporter mes données": the export as a JSON file in the cache, handed to
 * the native share sheet (save to Files, send by mail…). False when the
 * phone cannot share.
 */
export async function shareExport(data: ExportData, today: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, `habittt-${today}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Exporter mes données',
  });
  return true;
}
