import { basename } from 'node:path'

export interface MonocoFeetCatalogEntry {
  skillId: string
  skillName: string
  footName: string
}

export interface MonocoFeetCatalogFile {
  MonocoFeet: Record<string, MonocoFeetCatalogEntry>
}

interface LocalizedText {
  SourceString?: string | null
  CultureInvariantString?: string | null
}

interface CompositeItemRow {
  Item_DisplayName_89_41C0C54E4A55598869C84CA3B5B5DECA?: LocalizedText
}

interface CompositeItemTable {
  Rows?: Record<string, CompositeItemRow>
}

interface SkillGraphUnlockNode {
  SkillUnlock_3_15FA1C06433ACE049603919CDF6155FF?: {
    Skill_2_9E4FC5804778258FBAA04BBF7F68F799?: {
      ObjectPath?: string
    }
    RequiresUnlockItem_18_D9EBC20F41097DD7517E428E4A57655E?: {
      RowName?: string
    }
  }
}

interface SkillGraphDataAsset {
  Properties?: {
    Nodes?: SkillGraphUnlockNode[]
  }
}

interface MonocoSkillAsset {
  Properties?: {
    NameID?: string
    name?: LocalizedText
  }
}

function readLocalizedText(value?: LocalizedText): string {
  return value?.SourceString || value?.CultureInvariantString || ''
}

function normalizeSkillSortName(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function resolveMonocoSkillAssetPath(objectPath: string): string {
  return objectPath
    .replace('/Game/Gameplay/SkillTree/Content/Monoco/Skills/', 'originalGameMapping/MonocoSkills/')
    .replace(/\.\d+$/, '.json')
}

export function buildMonocoFeetCatalog(
  compositeData: CompositeItemTable[],
  skillGraphData: SkillGraphDataAsset[],
  readSkillAsset: (skillAssetPath: string) => MonocoSkillAsset[],
): MonocoFeetCatalogFile {
  const compositeRows = compositeData[0]?.Rows ?? {}
  const skillNodes = skillGraphData[0]?.Properties?.Nodes ?? []
  const footNames = new Map<string, string>()

  for (const [footId, row] of Object.entries(compositeRows)) {
    if (!footId.endsWith('Foot')) {
      continue
    }

    const footName = readLocalizedText(
      row.Item_DisplayName_89_41C0C54E4A55598869C84CA3B5B5DECA,
    )

    if (footName) {
      footNames.set(footId, footName)
    }
  }

  const entries: Array<[string, MonocoFeetCatalogEntry]> = []

  for (const node of skillNodes) {
    const unlock = node.SkillUnlock_3_15FA1C06433ACE049603919CDF6155FF
    const footId = unlock?.RequiresUnlockItem_18_D9EBC20F41097DD7517E428E4A57655E?.RowName
    const objectPath = unlock?.Skill_2_9E4FC5804778258FBAA04BBF7F68F799?.ObjectPath

    if (!footId || footId === 'None' || footId.includes('GradientUnlock')) {
      continue
    }

    if (!objectPath) {
      continue
    }

    const skillAssetPath = resolveMonocoSkillAssetPath(objectPath)
    const skillAsset = readSkillAsset(skillAssetPath)[0]?.Properties
    const skillId = skillAsset?.NameID ?? ''
    const skillName = readLocalizedText(skillAsset?.name)
    const footName = footNames.get(footId) ?? ''

    if (!skillId || !skillName || !footName) {
      continue
    }

    entries.push([
      footId,
      {
        skillId,
        skillName,
        footName,
      },
    ])
  }

  entries.sort((left, right) => {
    const skillCompare = normalizeSkillSortName(left[1].skillName).localeCompare(
      normalizeSkillSortName(right[1].skillName),
    )

    if (skillCompare !== 0) {
      return skillCompare
    }

    return left[0].localeCompare(right[0])
  })

  return {
    MonocoFeet: Object.fromEntries(entries),
  }
}

export function getMonocoSkillAssetFileName(objectPath: string): string {
  return basename(resolveMonocoSkillAssetPath(objectPath))
}
