import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recording, RecordingFilter, Tag } from "../types";
import { mockRecordings, mockTags } from "../mocks/recordings";
import { getIPFSService, MobileIPFSService } from "../services/ipfsService";

interface RecordingsState {
  recordings: Recording[];
  tags: Tag[];
  filter: RecordingFilter;
  currentRecordingId: string | null;
  isPlaying: boolean;

  // IPFS state
  ipfsService: MobileIPFSService | null;
  isUploadingToIPFS: boolean;
  ipfsUploadProgress: number;

  // Actions
  addRecording: (recording: Recording) => void;
  addRecordingWithIPFS: (recording: Recording, fileUri: string, starknetActions?: { storeRecording: (ipfsHash: string, metadata: any) => Promise<string> }) => Promise<void>;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  setFilter: (filter: Partial<RecordingFilter>) => void;
  resetFilter: () => void;
  setCurrentRecording: (id: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  importRecordings: (recordings: Recording[]) => void;
  addTagToRecording: (recordingId: string, tagId: string) => void;
  removeTagFromRecording: (recordingId: string, tagId: string) => void;
}

// Default filter state
const defaultFilter: RecordingFilter = {
  search: "",
  tags: [],
  sortBy: "date",
  sortOrder: "desc",
  favorites: false, // Note: Favorite filtering logic will need a separate UI state store
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

      // IPFS actions
      addRecordingWithIPFS: async (recording, fileUri, starknetActions) => {
        try {
          set({ isUploadingToIPFS: true, ipfsUploadProgress: 0 });

          // Initialize IPFS service if not already done
          if (!get().ipfsService) {
            const ipfsService = getIPFSService();
            set({ ipfsService });
            // Test connection without arguments
            const isConnected = await ipfsService.testConnection();
            if (!isConnected) {
              console.warn("IPFS connection test failed - uploads may not work");
            }
          }

          const ipfsService = get().ipfsService;

          // Upload to IPFS using mobile-specific method
          set({ ipfsUploadProgress: 50 });
          const ipfsResult = await ipfsService.uploadAudioFromUri(fileUri, {
            filename: recording.title,
            mimeType: recording.mimeType || 'audio/mpeg',
            duration: recording.duration,
          });

          set({ ipfsUploadProgress: 75 });

          // Try to store on Starknet if wallet is connected and actions are provided
          let starknetTxHash: string | undefined;
          try {
            if (starknetActions?.storeRecording) {
              const metadata = {
                title: recording.title,
                description: recording.description || '',
                ipfsHash: ipfsResult.hash, // Use the full IPFS hash
                duration: recording.duration,
                fileSize: ipfsResult.size,
                isPublic: recording.isPublic || false,
                tags: recording.tags || [],
              };
              starknetTxHash = await starknetActions.storeRecording(ipfsResult.hash, metadata);
            }
          } catch (starknetError) {
            console.warn('Starknet storage failed, continuing with IPFS only:', starknetError);
          }

          set({ ipfsUploadProgress: 100 });

          // Add recording with IPFS hash and optional Starknet hash
          const recordingWithBlockchain = {
            ...recording,
            id: recording.id || Date.now().toString(),
            ipfsHash: ipfsResult.hash,
            ipfsUrl: ipfsResult.url,
            fileSize: ipfsResult.size,
            starknetTxHash,
            isPublic: true, // IPFS recordings are public by default
            createdAt: recording.createdAt || new Date(),
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
            recordings: [...state.recordings, {
              ...recording,
              id: recording.id || Date.now().toString(),
              createdAt: recording.createdAt || new Date(),
            }],
          }));
        }
      },

      // New function to sync recordings from Base
      syncWithBase: async (baseService: any, walletAddress: string) => {
        try {
          // Get recordings from Base
          const onChainRecordings = await baseService.getUserRecordings(walletAddress);
          
          // Initialize IPFS service if not already done
          if (!get().ipfsService) {
            const ipfsService = getIPFSService();
            set({ ipfsService });
          }
          
          const ipfsService = get().ipfsService;
          
          // Enhance recordings with IPFS data
          const enhancedRecordings = await Promise.all(
            onChainRecordings.map(async (recording: any) => {
              try {
                // Get playback URL for the recording
                const ipfsUrl = ipfsService.getAudioUrl(recording.ipfsHash);
                
                // Try to get file info
                const fileInfo = await ipfsService.getFileInfo(recording.ipfsHash);
                
                return {
                  ...recording,
                  id: recording.id.toString(),
                  ipfsUrl,
                  fileSize: fileInfo?.size || recording.fileSize,
                  mimeType: fileInfo?.type || 'audio/mpeg',
                  // Add a flag to indicate this is from blockchain
                  onChain: true,
                  createdAt: new Date(recording.createdAt * 1000), // Convert from seconds to milliseconds
                };
              } catch (error) {
                console.warn('Failed to enhance recording with IPFS data:', error);
                return {
                  ...recording,
                  id: recording.id.toString(),
                  ipfsUrl: ipfsService.getAudioUrl(recording.ipfsHash),
                  onChain: true,
                  createdAt: new Date(recording.createdAt * 1000), // Convert from seconds to milliseconds
                };
              }
            })
          );
          
          // Merge with existing recordings, prioritizing on-chain data
          const existingRecordings = get().recordings;
          const localOnlyRecordings = existingRecordings.filter(
            (local: any) => !enhancedRecordings.some(
              (onChain: any) => onChain.id === local.id
            )
          );
          
          set({
            recordings: [...enhancedRecordings, ...localOnlyRecordings],
          });
          
          return enhancedRecordings.length;
        } catch (error) {
          console.error('Failed to sync with Base:', error);
          throw error;
        }
      },
    }),
    {
      name: "voisss-recordings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Add partialize to prevent storing the IPFS service in persisted state
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ipfsService, isUploadingToIPFS, ipfsUploadProgress, ...rest } = state;
        return rest;
      },
    }
  )
);

// Memoized selector to get filtered recordings
export const useFilteredRecordings = () => {
  // Get only the necessary state to prevent unnecessary re-renders
  const recordings = useRecordingsStore((state) => state.recordings);
  const filter = useRecordingsStore((state) => state.filter);

  // This is where you would also get the UI state for favorites
  // const favoriteIds = useUIStore((state) => state.favoriteRecordingIds);

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
        filter.tags &&
        filter.tags.length > 0 &&
        !filter.tags.some((tagId) => recording.tags.includes(tagId))
      ) {
        return false;
      }

      // Filter by favorites (requires a separate UI state store)
      // if (filter.favorites && !favoriteIds.includes(recording.id)) {
      //   return false;
      // }

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