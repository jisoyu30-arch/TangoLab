import { useState, useCallback, useEffect } from 'react';
import type { TrainingState, TrainingStatus } from '../types/tango';
import { saveTrainingStateToFirestore, subscribeToTrainingState } from '../lib/firestoreTraining';
import { loadTrainingState, saveTrainingState } from '../utils/tangoHelpers';

export function useTrainingState(songId: string) {
  const [state, setState] = useState<TrainingState>(() => loadTrainingState(songId));

  // Firestore 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToTrainingState(songId, (firestoreState) => {
      if (firestoreState) {
        setState(firestoreState);
        // localStorage에도 동기화 (오프라인 폴백)
        saveTrainingState(songId, firestoreState);
      }
    });
    return () => unsubscribe();
  }, [songId]);

  const save = useCallback((next: TrainingState) => {
    setState(next);
    saveTrainingState(songId, next); // localStorage (즉시)
    saveTrainingStateToFirestore(songId, next).catch(console.error); // Firestore (비동기)
  }, [songId]);

  const updateStatus = useCallback((status: TrainingStatus) => {
    save({ ...state, status });
  }, [state, save]);

  const toggleFavorite = useCallback(() => {
    save({ ...state, favorite: !state.favorite });
  }, [state, save]);

  const updateNotes = useCallback((notes: string) => {
    save({ ...state, notes });
  }, [state, save]);

  return { state, updateStatus, toggleFavorite, updateNotes };
}
