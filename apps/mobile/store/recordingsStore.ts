import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MobileRecording, RecordingFilter, Tag } from "../types/recording";
import { mockRecordings, mockTags } from "../mocks/recordings";
import { createIPFSService } from "@voisss/shared";
import { useStarknet } from "../hooks/useStarknet";

interface RecordingsState {
  recordings: MobileRecording[];
  tags: Tag[];
  filter: RecordingFilter;
  currentRecordingId: string | null;
  isPlaying: boolean;

  // IPFS state
  ipfsService: any;
  isUploadingToIPFS: boolean;
  ipfsUploadProgress: number;

  // Actions
  addRecording: (recording: MobileRecording) => void;
  addRecordingWithIPFS: (recording: MobileRecording, fileUri: string, starknetActions?: { storeRecording: (ipfsHash: string, metadata: any) => Promise<string> }) => Promise<void>;
  updateRecording: (id: string, updates: Partial<MobileRecording>) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  setFilter: (filter: Partial<RecordingFilter>) => void;
  resetFilter: () => void;
  setCurrentRecording: (id: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  importRecordings: (recordings: MobileRecording[]) => void;
  addTagToRecording: (recordingId: string, tagId: string) => void;
  removeTagFromRecording: (recordingId: string, tagId: string) => void;

  // New community actions
  togglePublic: (id: string) => void;
  toggleShared: (id: string) => void;
  shareWithUsers: (recordingId: string, userIds: string[]) => void;
  incrementPlays: (id: string) => void;
  toggleLike: (id: string) => void;
}

// Default filter state
const defaultFilter: RecordingFilter = {
  search: "",
  tags: [],
  sortBy: "date",
  sortOrder: "desc",
  favorites: false,
};

export const useRecordingsStore = create<RecordingsState>()(
  persist(
    (set, get) => ({
      recordings: mockRecordings, // Start with mock data
      tags: mockTags, // Start with mock tags
      filter: defaultFilter,
      currentRecordingId: null,
      isPlaying: false,

      // IPFS state
      ipfsService: null,
      isUploadingToIPFS: false,
      ipfsUploadProgress: 0,

      addRecording: (recording) => {
        set((state) => ({
          recordings: [...state.recordings, recording],
        }));
      },

      updateRecording: (id, updates) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? {
                ...recording,
                ...updates,
                updatedAt: new Date(),
              }
              : recording
          ),
        }));
      },

      deleteRecording: (id) => {
        set((state) => ({
          recordings: state.recordings.filter(
            (recording) => recording.id !== id
          ),
          currentRecordingId:
            state.currentRecordingId === id ? null : state.currentRecordingId,
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? { ...recording, isFavorite: !recording.isFavorite }
              : recording
          ),
        }));
      },

      addTag: (tag) => {
        set((state) => ({
          tags: [...state.tags, tag],
        }));
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((tag) =>
            tag.id === id ? { ...tag, ...updates } : tag
          ),
        }));
      },

      deleteTag: (id: string) => {
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== id),
          // Also remove this tag from all recordings
          recordings: state.recordings.map((recording) => ({
            ...recording,
            tags: recording.tags.filter((tagId: string) => tagId !== id),
          })),
        }));
      },

      setFilter: (filter) => {
        set((state) => ({
          filter: { ...state.filter, ...filter },
        }));
      },

      resetFilter: () => {
        set({ filter: defaultFilter });
      },

      setCurrentRecording: (id) => {
        set({ currentRecordingId: id });
      },

      setIsPlaying: (isPlaying) => {
        set({ isPlaying });
      },

      importRecordings: (recordings) => {
        set((state) => ({
          recordings: [...state.recordings, ...recordings],
        }));
      },

      addTagToRecording: (recordingId, tagId) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === recordingId && !recording.tags.includes(tagId)
              ? { ...recording, tags: [...recording.tags, tagId] }
              : recording
          ),
        }));
      },

      removeTagFromRecording: (recordingId: string, tagId: string) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === recordingId
              ? {
                ...recording,
                tags: recording.tags.filter((id: string) => id !== tagId),
              }
              : recording
          ),
        }));
      },

      // New community actions
      togglePublic: (id) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? {
                ...recording,
                isPublic: !recording.isPublic,
                // If making public, ensure it's not shared with specific users
                ...(recording.isPublic
                  ? {}
                  : { isShared: false, sharedWith: [] }),
              }
              : recording
          ),
        }));
      },

      toggleShared: (id) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? {
                ...recording,
                isShared: !recording.isShared,
                // If making shared, ensure it's not public
                ...(recording.isShared ? {} : { isPublic: false }),
              }
              : recording
          ),
        }));
      },

      shareWithUsers: (recordingId, userIds) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === recordingId
              ? {
                ...recording,
                isShared: true,
                isPublic: false,
                sharedWith: userIds,
              }
              : recording
          ),
        }));
      },

      incrementPlays: (id) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? {
                ...recording,
                plays: (recording.plays || 0) + 1,
              }
              : recording
          ),
        }));
      },

      toggleLike: (id) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? {
                ...recording,
                likes: (recording.likes || 0) + 1,
              }
              : recording
          ),
        }));
      },

      // IPFS actions
      addRecordingWithIPFS: async (recording, fileUri, starknetActions) => {
        try {
          set({ isUploadingToIPFS: true, ipfsUploadProgress: 0 });

          // Initialize IPFS service if not already done
          if (!get().ipfsService) {
            const ipfsService = createIPFSService();
            set({ ipfsService });
            // Test connection without arguments
            const isConnected = await ipfsService.testConnection();
            if (!isConnected) {
              console.warn("IPFS connection test failed - uploads may not work");
            }
          }

          const ipfsService = get().ipfsService;

          // Convert file URI to blob for IPFS upload
          const response = await fetch(fileUri);
          const audioBlob = await response.blob();

          // Upload to IPFS
          set({ ipfsUploadProgress: 50 });
          const ipfsHash = await ipfsService.uploadFile(audioBlob);

          set({ ipfsUploadProgress: 75 });

          // Try to store on Starknet if wallet is connected and actions are provided
          let starknetTxHash: string | undefined;
          try {
            if (starknetActions?.storeRecording) {
              const metadata = {
                title: recording.title,
                duration: recording.duration,
                tags: recording.tags,
                createdAt: recording.createdAt,
              };
              starknetTxHash = await starknetActions.storeRecording(ipfsHash, metadata);
            }
          } catch (starknetError) {
            console.warn('Starknet storage failed, continuing with IPFS only:', starknetError);
          }

          set({ ipfsUploadProgress: 100 });

          // Add recording with IPFS hash and optional Starknet hash
          const recordingWithBlockchain = {
            ...recording,
            ipfsHash,
            starknetTxHash,
            isPublic: true, // IPFS recordings are public by default
          };

          set((state) => ({
            recordings: [...state.recordings, recordingWithBlockchain],
            isUploadingToIPFS: false,
            ipfsUploadProgress: 0,
          }));

        } catch (error) {
          console.error('IPFS upload failed:', error);
          set({ isUploadingToIPFS: false, ipfsUploadProgress: 0 });

          // Still add the recording locally even if IPFS fails
          set((state) => ({
            recordings: [...state.recordings, recording],
          }));
        }
      },
    }),
    {
      name: "voisss-recordings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Memoized selector to get filtered recordings
export const useFilteredRecordings = () => {
  // Get only the necessary state to prevent unnecessary re-renders
  const recordings = useRecordingsStore((state) => state.recordings);
  const filter = useRecordingsStore((state) => state.filter);

  // Apply filters
  const filteredRecordings = recordings
    .filter((recording) => {
      // Filter by search term
      if (
        filter.search &&
        !recording.title.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false;
      }

      // Filter by tags
      if (
        filter.tags.length > 0 &&
        !filter.tags.some((tagId) => recording.tags.includes(tagId))
      ) {
        return false;
      }

      // Filter by favorites
      if (filter.favorites && !recording.isFavorite) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      const sortOrder = filter.sortOrder === "asc" ? 1 : -1;

      switch (filter.sortBy) {
        case "date":
          return (
            sortOrder *
            (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          );
        case "duration":
          return sortOrder * (a.duration - b.duration);
        case "name":
          return sortOrder * a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return filteredRecordings;
};

// Selector to get a recording by ID
export const useRecording = (id: string | null) => {
  return useRecordingsStore((state) =>
    id ? state.recordings.find((recording) => recording.id === id) : null
  );
};

// Selector to get tags for a recording
export const useRecordingTags = (recordingId: string | null) => {
  // Return empty array if no recording ID
  if (!recordingId) return [];

  // Get only the necessary state
  const allTags = useRecordingsStore((state) => state.tags);
  const recording = useRecordingsStore((state) =>
    state.recordings.find((r) => r.id === recordingId)
  );

  if (!recording) return [];

  return recording.tags
    .map((tagId: string) => allTags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => tag !== undefined);
};
