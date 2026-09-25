/**
 * Service for managing study notes
 * Handles project-specific research notes for scientists
 */

import { supabase } from './supabaseClient';

export interface StudyNote {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudyNoteInput {
  project_id: string;
  title: string;
  content: string;
}

export interface UpdateStudyNoteInput {
  title?: string;
  content?: string;
}

export class StudyNotesService {
  private static instance: StudyNotesService;

  private constructor() {}

  public static getInstance(): StudyNotesService {
    if (!StudyNotesService.instance) {
      StudyNotesService.instance = new StudyNotesService();
    }
    return StudyNotesService.instance;
  }

  /**
   * Get all notes for a specific project
   */
  async getNotesByProject(projectId: string): Promise<StudyNote[]> {
    try {
      const { data, error } = await supabase
        .from('study_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching study notes:', error);
        throw error;
      }

      return (data || []) as StudyNote[];
    } catch (error) {
      console.error('Failed to fetch study notes:', error);
      return [];
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(noteId: string): Promise<StudyNote | null> {
    try {
      const { data, error } = await supabase
        .from('study_notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('Error fetching note by ID:', error);
        throw error;
      }

      return data as StudyNote;
    } catch (error) {
      console.error('Failed to fetch note by ID:', error);
      return null;
    }
  }

  /**
   * Create a new note
   */
  async createNote(input: CreateStudyNoteInput): Promise<StudyNote | null> {
    try {
      const { data, error } = await supabase
        .from('study_notes')
        .insert([
          {
            project_id: input.project_id,
            title: input.title.trim(),
            content: input.content.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating study note:', error);
        throw error;
      }

      return data as StudyNote;
    } catch (error) {
      console.error('Failed to create study note:', error);
      return null;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, input: UpdateStudyNoteInput): Promise<StudyNote | null> {
    try {
      const updateData: any = {};
      if (input.title !== undefined) {
        updateData.title = input.title.trim();
      }
      if (input.content !== undefined) {
        updateData.content = input.content.trim();
      }

      const { data, error } = await supabase
        .from('study_notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating study note:', error);
        throw error;
      }

      return data as StudyNote;
    } catch (error) {
      console.error('Failed to update study note:', error);
      return null;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('study_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting study note:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete study note:', error);
      return false;
    }
  }
}

export default StudyNotesService.getInstance();

