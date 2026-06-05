import type {
  AuthoredContent,
  ContentId,
  LessonContent,
  LocationContent,
  NpcContent,
  QuestContent,
} from '../types/content';

interface RegistryContentSource {
  get(key: string): unknown;
}

type ContentCollectionName = keyof AuthoredContent;
type IndexedContent = LocationContent | NpcContent | QuestContent | LessonContent;

const contentCollectionNames: readonly ContentCollectionName[] = ['locations', 'npcs', 'quests', 'lessons'];

export class ContentDatabase {
  private readonly locations: readonly LocationContent[];
  private readonly npcs: readonly NpcContent[];
  private readonly quests: readonly QuestContent[];
  private readonly lessons: readonly LessonContent[];

  private readonly locationsById: ReadonlyMap<ContentId, LocationContent>;
  private readonly npcsById: ReadonlyMap<ContentId, NpcContent>;
  private readonly questsById: ReadonlyMap<ContentId, QuestContent>;
  private readonly lessonsById: ReadonlyMap<ContentId, LessonContent>;

  private readonly npcsByLocationId: ReadonlyMap<ContentId, readonly NpcContent[]>;
  private readonly questsByNpcId: ReadonlyMap<ContentId, readonly QuestContent[]>;
  private readonly lessonsByNpcId: ReadonlyMap<ContentId, readonly LessonContent[]>;

  private readonly warnings: readonly string[];

  public constructor(source?: Partial<AuthoredContent> | RegistryContentSource | unknown) {
    const warningBuffer: string[] = [];
    const content = this.resolveContent(source);

    this.locations = this.readCollection<LocationContent>(content, 'locations', warningBuffer);
    this.npcs = this.readCollection<NpcContent>(content, 'npcs', warningBuffer);
    this.quests = this.readCollection<QuestContent>(content, 'quests', warningBuffer);
    this.lessons = this.readCollection<LessonContent>(content, 'lessons', warningBuffer);

    this.locationsById = this.buildIdIndex(this.locations, 'location', warningBuffer);
    this.npcsById = this.buildIdIndex(this.npcs, 'npc', warningBuffer);
    this.questsById = this.buildIdIndex(this.quests, 'quest', warningBuffer);
    this.lessonsById = this.buildIdIndex(this.lessons, 'lesson', warningBuffer);

    this.npcsByLocationId = this.groupById(this.npcs, 'location_id');
    this.questsByNpcId = this.groupById(this.quests, 'giver_npc_id');
    this.lessonsByNpcId = this.groupById(this.lessons, 'npc_id');

    this.warnings = Object.freeze([...warningBuffer]);
  }

  public static fromRegistry(registry: RegistryContentSource): ContentDatabase {
    return new ContentDatabase(registry);
  }

  public getLocation(id: string): LocationContent | undefined {
    return this.locationsById.get(id);
  }

  public getNpc(id: string): NpcContent | undefined {
    return this.npcsById.get(id);
  }

  public getQuest(id: string): QuestContent | undefined {
    return this.questsById.get(id);
  }

  public getLesson(id: string): LessonContent | undefined {
    return this.lessonsById.get(id);
  }

  public getLocations(): readonly LocationContent[] {
    return this.locations;
  }

  public getNpcs(): readonly NpcContent[] {
    return this.npcs;
  }

  public getQuests(): readonly QuestContent[] {
    return this.quests;
  }

  public getLessons(): readonly LessonContent[] {
    return this.lessons;
  }

  public getNpcsByLocation(locationId: string): readonly NpcContent[] {
    return this.npcsByLocationId.get(locationId) ?? [];
  }

  public getQuestsByNpc(npcId: string): readonly QuestContent[] {
    return this.questsByNpcId.get(npcId) ?? [];
  }

  public getLessonsByNpc(npcId: string): readonly LessonContent[] {
    return this.lessonsByNpcId.get(npcId) ?? [];
  }

  public getWarnings(): readonly string[] {
    return this.warnings;
  }

  private resolveContent(source: Partial<AuthoredContent> | RegistryContentSource | unknown): Partial<AuthoredContent> {
    if (this.isRegistryContentSource(source)) {
      const registryContent = source.get('content');
      return this.isAuthoredContentLike(registryContent) ? registryContent : {};
    }

    return this.isAuthoredContentLike(source) ? source : {};
  }

  private readCollection<T extends IndexedContent>(
    content: Partial<AuthoredContent>,
    collectionName: ContentCollectionName,
    warningBuffer: string[],
  ): readonly T[] {
    const collection = content[collectionName];

    if (!Array.isArray(collection)) {
      warningBuffer.push(`Missing or invalid ${collectionName} content; using an empty list.`);
      return Object.freeze([] as T[]);
    }

    const validRecords: T[] = [];

    collection.forEach((record, index) => {
      if (!this.isContentRecord(record)) {
        warningBuffer.push(`Skipped ${collectionName}[${index}] because it is not an object with a string id.`);
        return;
      }

      validRecords.push(record as T);
    });

    return Object.freeze([...validRecords]);
  }

  private buildIdIndex<T extends IndexedContent>(
    records: readonly T[],
    label: string,
    warningBuffer: string[],
  ): ReadonlyMap<ContentId, T> {
    const index = new Map<ContentId, T>();

    records.forEach((record) => {
      if (index.has(record.id)) {
        warningBuffer.push(`Duplicate ${label} id "${record.id}" found; keeping the first record in the id index.`);
        return;
      }

      index.set(record.id, record);
    });

    return index;
  }

  private groupById<T extends IndexedContent, K extends keyof T>(
    records: readonly T[],
    key: K,
  ): ReadonlyMap<ContentId, readonly T[]> {
    const groupedRecords = new Map<ContentId, T[]>();

    records.forEach((record) => {
      const groupId = record[key];

      if (typeof groupId !== 'string' || groupId.length === 0) {
        return;
      }

      const group = groupedRecords.get(groupId) ?? [];
      group.push(record);
      groupedRecords.set(groupId, group);
    });

    const readonlyGroups = new Map<ContentId, readonly T[]>();
    groupedRecords.forEach((group, id) => {
      readonlyGroups.set(id, Object.freeze([...group]));
    });

    return readonlyGroups;
  }

  private isRegistryContentSource(source: unknown): source is RegistryContentSource {
    return typeof source === 'object' && source !== null && 'get' in source && typeof source.get === 'function';
  }

  private isAuthoredContentLike(source: unknown): source is Partial<AuthoredContent> {
    if (typeof source !== 'object' || source === null) {
      return false;
    }

    return contentCollectionNames.some((collectionName) => collectionName in source);
  }

  private isContentRecord(record: unknown): record is { id: string } {
    return (
      typeof record === 'object' &&
      record !== null &&
      'id' in record &&
      typeof record.id === 'string' &&
      record.id.length > 0
    );
  }
}
