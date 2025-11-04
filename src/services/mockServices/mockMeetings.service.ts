
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types';
import { MeetingWithRelations } from '../meetings.service';

class MockMeetingsService {
  private meetings: MeetingWithRelations[] = [];

  async getAll(): Promise<MeetingWithRelations[]> {
    console.log('MockMeetingsService: getAll');
    return this.meetings;
  }

  async getById(id: string): Promise<MeetingWithRelations> {
    console.log(`MockMeetingsService: getById(${id})`);
    const meeting = this.meetings.find((m) => m.id === id);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    return meeting;
  }

  async create(meetingData: MeetingInsert): Promise<Meeting> {
    console.log('MockMeetingsService: create', meetingData);
    const newMeeting = {
      ...meetingData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id',
    } as Meeting;
    // Note: This mock doesn't handle relations properly
    this.meetings.push(newMeeting as MeetingWithRelations);
    return newMeeting;
  }

  async update(id: string, updates: MeetingUpdate): Promise<Meeting> {
    console.log(`MockMeetingsService: update(${id})`, updates);
    const meeting = this.meetings.find((m) => m.id === id);
    if (meeting) {
      const updatedMeeting = { ...meeting, ...updates, updated_at: new Date().toISOString() };
      this.meetings = this.meetings.map((m) => (m.id === id ? updatedMeeting : m));
      return updatedMeeting as Meeting;
    }
    throw new Error('Meeting not found for update');
  }

  async delete(id: string): Promise<void> {
    console.log(`MockMeetingsService: delete(${id})`);
    this.meetings = this.meetings.filter((m) => m.id !== id);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<MeetingWithRelations[]> {
    console.log(`MockMeetingsService: getByDateRange(${startDate}, ${endDate})`);
    return this.meetings;
  }

  async getUpcoming(limit = 10): Promise<MeetingWithRelations[]> {
    console.log(`MockMeetingsService: getUpcoming(${limit})`);
    return this.meetings.slice(0, limit);
  }
  
  resetData() {
    this.meetings = [];
  }

  async getStats() {
    return { count: this.meetings.length };
  }
}

export const mockMeetingsService = new MockMeetingsService();
