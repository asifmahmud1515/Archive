
export interface ArchiveSearchResult {
  identifier: string;
  title?: string;
  description?: string;
  date?: string;
  mediatype?: string;
  creator?: string;
  subject?: string[];
}

export const searchInternetArchive = async (query: string, limit: number = 10, page: number = 1): Promise<ArchiveSearchResult[]> => {
  try {
    const response = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
        query
      )}&fl[]=identifier&fl[]=title&fl[]=description&fl[]=date&fl[]=mediatype&fl[]=creator&fl[]=subject&sort[]=downloads+desc&rows=${limit}&page=${page}&output=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Internet Archive');
    }
    
    const data = await response.json();
    return data.response.docs.map((doc: any) => ({
      identifier: doc.identifier,
      title: doc.title || 'Untitled',
      description: doc.description || 'No description available.',
      date: doc.date || 'Unknown Date',
      mediatype: doc.mediatype || 'unknown',
      creator: doc.creator || 'Unknown Creator',
      subject: Array.isArray(doc.subject) ? doc.subject : [doc.subject].filter(Boolean)
    }));
  } catch (error) {
    console.error('Archive Search Error:', error);
    return [];
  }
};

export const getArchiveItemMetadata = async (identifier: string) => {
  try {
    const response = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }
    return await response.json();
  } catch (error) {
    console.error('Archive Metadata Error:', error);
    return null;
  }
};

export const getArchiveImageUrl = (identifier: string) => {
  return `https://archive.org/services/img/${identifier}`;
};

export const getArchiveItemUrl = (identifier: string) => {
  return `https://archive.org/details/${identifier}`;
};
