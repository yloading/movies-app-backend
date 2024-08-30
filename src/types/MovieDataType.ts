export type MovieDataType = {
  id: string | null;
  title: string;
  scores: {
    imdb: { rating: string | number; reviews: string; link: string };
    rottenTomato?: { rating: string | number; reviews: string; link: string };
    metaCritic?: { rating: string | number; reviews: string; link: string };
  };
  contentRating: string;
  releaseDate: string;
  releaseYear: string;
  duration: string;
  categories: string[];
  summary: string;
  director: string;
  writers: string[];
  stars: string[];
  topStars: TopStarsType[];
  photos: string[];
};

export type TopStarsType = {
  actorName?: string;
  characterName?: string;
};
