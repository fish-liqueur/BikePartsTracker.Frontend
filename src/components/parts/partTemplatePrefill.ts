import type { BikePart, CreatePartDto } from '@/types';
import type { PartType } from '@/types';

export interface TemplatePrefillOptions {
  /** When set, `partType` is not copied from the template (form keeps locked type). */
  lockPartType?: PartType | null;
}

/** Maps an existing part to partial form data. Never includes `name` (callers merge name separately). */
export function mapBikePartToTemplatePrefill(
  part: BikePart,
  options: TemplatePrefillOptions = {}
): Partial<CreatePartDto> {
  const out: Partial<CreatePartDto> = {
    description: part.description ?? '',
    brand: part.brand ?? '',
    model: part.model ?? '',
    bikeId: part.bikeId ?? '',
    mileageAtInstallation: part.mileageAtInstallation ?? 0
  };

  if (part.installationDate) {
    out.installationDate =
      part.installationDate instanceof Date
        ? part.installationDate
        : new Date(part.installationDate);
  }

  if (!options.lockPartType) {
    out.partType = part.partType;
  }

  return out;
}
