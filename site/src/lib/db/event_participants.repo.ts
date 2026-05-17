import { isCharacter, type Character } from './character.repo';
import { mysqlconnFn } from './mysql';

class EventParticipatnsRepo {
  public async participate({
    eventId,
    userId,
    characterVersionId
  }: {
    eventId: number;
    userId: number;
    characterVersionId: number;
  }) {
    const connection = await mysqlconnFn();
    await connection.execute(
      `INSERT INTO Event_Participants (Event, User, CharacterVersion) VALUES (?, ?, ?)
			 ON DUPLICATE KEY UPDATE CharacterVersion = VALUES(CharacterVersion)`,
      [eventId, userId, characterVersionId]
    );
  }

  public async withdraw({
    eventId,
    characterVersionId
  }: {
    eventId: number;
    characterVersionId: number;
  }) {
    try {
      const connection = await mysqlconnFn();
      await connection.execute(
        `
                DELETE Event_Participants 
                WHERE EventId = :eventId
                AND CharacterId = :characterVersionId
            `,
        { eventId, characterVersionId }
      );
    } catch (err) {
      throw err;
    }
  }

  public async getPerticipants({ eventId }: { eventId: number }): Promise<Character[]> {
    try {
      const connection = await mysqlconnFn();
      const [result] = await connection.execute(
        `
					SELECT
						c.Id as id,
						c.Name as name,
						u.Id as ownerId,
						u.Name as ownerName,
					FROM Event_Participants ep 
					JOIN Character_Versions cv
						on cv.Id = ep.CharacterVersion
					JOIN Characters c
						on c.id = cv.Character
					JOIN Users u
						on u.Id = ep.User
					WHERE ep.EventId = :eventId
        `,
        { eventId }
      );
      if (Array.isArray(result) === false) return [];
      if (result.length === 0) return [];
      const characters: Character[] = [];
      for (const characterResult of result) {
        if (isCharacter(characterResult)) characters.push(characterResult);
        else
          console.error(`%c sql result is not a character`, `background:red;color:black`, {
            characterResult
          });
      }
      return characters;
    } catch (err) {
      throw err;
    }
  }

  public async getEventsForCharacters(characterIds: number[]): Promise<{ characterId: number; eventId: number; eventName: string }[]> {
    if (characterIds.length === 0) return [];
    try {
      const connection = await mysqlconnFn();
      const [result] = await connection.query(
        `SELECT
					cv.Character as characterId,
					e.Id as eventId,
					e.Name as eventName
				FROM Event_Participants ep
				JOIN Character_Versions cv ON cv.Id = ep.CharacterVersion
				JOIN Events e ON e.Id = ep.Event
				WHERE cv.Character IN (?)`,
        [characterIds]
      );
      if (!Array.isArray(result) || result.length === 0) return [];
      const rows: { characterId: number; eventId: number; eventName: string }[] = [];
      for (const row of result as any[]) {
        if (typeof row.characterId !== 'number' || typeof row.eventId !== 'number' || typeof row.eventName !== 'string') continue;
        rows.push({ characterId: row.characterId, eventId: row.eventId, eventName: row.eventName });
      }
      return rows;
    } catch (err) {
      throw err;
    }
  }

  public async getUserParticipation({ eventId, userId }: { eventId: number; userId: number }): Promise<{ characterId: number; characterVersionId: number } | undefined> {
    try {
      const connection = await mysqlconnFn();
      const [result] = await connection.execute(
        `SELECT
					cv.Character as characterId,
					ep.CharacterVersion as characterVersionId
				FROM Event_Participants ep
				JOIN Character_Versions cv ON cv.Id = ep.CharacterVersion
				WHERE ep.Event = ? AND ep.User = ?`,
        [eventId, userId]
      );
      if (!Array.isArray(result) || result.length === 0) return undefined;
      const [row] = result as any[];
      if (typeof row.characterId !== 'number' || typeof row.characterVersionId !== 'number') return undefined;
      return { characterId: row.characterId, characterVersionId: row.characterVersionId };
    } catch (err) {
      throw err;
    }
  }

  public async getParticipantForCharacter({
    eventId,
    characterId
  }: {
    eventId: number;
    characterId: number;
  }): Promise<EventParticapant | undefined> {
    try {
      const connection = await mysqlconnFn();
      const [result] = await connection.execute(
        `
	        SELECT
						ep.Event as eventId,
						ep.User as userId,
						ep.CharacterVersion as characterVersion
	        FROM Event_Participants  ep
					JOIN Character_Versions cv
						ON cv.Id = ep.CharacterVersion
          WHERE ep.Event = :eventId
						AND cv.Character = :characterId
        `,
        { eventId, characterId }
      );
      if (Array.isArray(result) === false) return undefined;
      if (result.length === 0) return undefined;
      const [participantResult] = result;
      if (isEventParticapant(participantResult)) return participantResult;
      console.error(`%c sql result is not an participant`, `background:red;color:black`, {
        character: participantResult
      });
    } catch (err) {
      throw err;
    }
  }
}

export const eventParticipantsRepo = new EventParticipatnsRepo();

export type EventParticapant = {
  eventId: number;
  userId: number;
  characterVersion: number;
};

export function isEventParticapant(particiapant: unknown): particiapant is EventParticapant {
  return (
    typeof particiapant === 'object' &&
    particiapant != null &&
    'eventId' in particiapant &&
    typeof particiapant.eventId === 'number' &&
    'userId' in particiapant &&
    typeof particiapant.userId === 'number' &&
    'characterVersion' in particiapant &&
    typeof particiapant.characterVersion === 'number'
  );
}
