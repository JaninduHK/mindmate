import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../api/emergency/content.api.js';

/**
 * Hook for fetching wellness content with filtering
 * @param {object} filters - Content filters
 * @returns {object} Content list and loading state
 */
export const useContent = (filters = {}) => {
  const { data: contentData, isLoading, isFetching } = useQuery({
    queryKey: ['content', filters],
    queryFn: () => contentAPI.getContent(filters).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    contentList: contentData?.data || [],
    isLoading,
    isFetching,
  };
};

/**
 * Hook for fetching recommended content
 * @returns {object} Recommended content list and loading state
 */
export const useRecommendedContent = () => {
  const { data: recommendedData, isLoading } = useQuery({
    queryKey: ['recommendedContent'],
    queryFn: () => contentAPI.getRecommendations().then(res => res.data),
    staleTime: 60000, // 1 minute
  });

  return {
    recommendedContent: recommendedData?.data || [],
    isLoading,
  };
};

/**
 * Hook for getting search links for external resources
 * @returns {object} Function to fetch search links
 */
export const useSearchLinks = () => {
  return {
    fetchSearchLinks: (contentType) => 
      contentAPI.getSearchLinks(contentType).then(res => res.data?.data || []),
  };
};
