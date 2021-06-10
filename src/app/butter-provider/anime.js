'use strict';

var Generic = require('./generic');
var request = require('request');
var sanitize = require('butter-sanitize');

class AnimeApi extends Generic {
  constructor(args) {
    super(args);

    if (args.apiURL) this.apiURL = args.apiURL.split(',');

    this.language = args.language;
    this.quality = args.quality;
    this.translate = args.translate;
  }

  _get(index, url, qs) {
    const req = this.buildRequest(
        {
          url,
          json: true,
          qs
        },
        this.apiURL[index]
    );
    console.info('Request to AnimeApi', req.url);

    return new Promise((resolve, reject) => {
      request(req, (err, res, data) => {
        if (err || res.statusCode >= 400) {
          console.warn(`AnimeAPI endpoint ${that.apiURL[index]} failed.`);
          if (index + 1 >= that.apiURL.length) {
            return deferred.reject(err || 'Status Code is above 400');
          } else {
            return get(index + 1, url, that);
          }
        } else if (!data || data.error) {
          err = data ? data.status_message : 'No data returned';
          console.error('API error:', err);
          return deferred.reject(err);
        } else {
          return deferred.resolve(data);
        }
      });
    });
  }

  extractIds(items) {
    return items.results.map(item => item.mal_id);
  }

  fetch(filters) {
    const params = {
      sort: 'seeds',
      limit: '50'
    };

    if (filters.keywords) {
      params.keywords = this.apiURL[0].includes('popcorn-ru') ? filters.keywords.trim() : filters.keywords.trim().replace(/[^a-zA-Z0-9]|\s/g, '% ');
    }
    if (filters.genre) {
      params.genre = filters.genre;
    }
    if (filters.order) {
      params.order = filters.order;
    }
    if (filters.sorter && filters.sorter !== 'popularity') {
      params.sort = filters.sorter;
    }

    const index = 0;
    const url = `${this.apiURL[index]}animes/${filters.page}`;
    return this._get(index, url, params).then(animes => {
      animes.forEach(anime => {
        return {
          images: {
            poster: 'https://media.kitsu.io/anime/poster_images/' + anime._id + '/large.jpg',
            banner: 'https://media.kitsu.io/anime/cover_images/' + anime._id + '/original.jpg',
            fanart: 'https://media.kitsu.io/anime/cover_images/' + anime._id + '/original.jpg',
          },
          mal_id: anime._id,
          haru_id: anime._id,
          tvdb_id: 'mal-' + anime._id,
          imdb_id: anime._id,
          slug: anime.slug,
          title: anime.title,
          year: anime.year,
          type: anime.type,
          item_data: anime.type,
          rating: anime.rating
        };
      });

      return { results: sanitize(animes), hasMore: true };
    });
  }

  detail(torrent_id, old_data, debug) {
    const index = 0;
    const url = `${this.apiURL[index]}anime/${torrent_id}`;

    return this._get(index, url).then(anime => {
      var result = {
        mal_id: anime._id,
        haru_id: anime._id,
        tvdb_id: 'mal-' + anime._id,
        imdb_id: anime._id,
        slug: anime.slug,
        title: anime.title,
        item_data: anime.type,
        country: 'Japan',
        genre: anime.genres,
        genres: anime.genres,
        num_seasons: 1,
        runtime: anime.runtime,
        status: anime.status,
        synopsis: anime.synopsis,
        network: [], //FIXME
        rating: anime.rating,
        images: {
          poster: 'https://media.kitsu.io/anime/poster_images/' + anime._id + '/large.jpg',
          banner: 'https://media.kitsu.io/anime/cover_images/' + anime._id + '/original.jpg',
          fanart: 'https://media.kitsu.io/anime/cover_images/' + anime._id + '/original.jpg',
        },
        year: anime.year,
        type: anime.type
      };

      if (anime.type === 'show') {
        result = Object.extend(result, { episodes: anime.episodes });
      }

      return sanitize(result);
    });
  }
}

AnimeApi.prototype.config = {
  name: 'AnimeApi',
  uniqueId: 'mal_id',
  tabName: 'Animes',
  type: 'anime',
  metadata: 'trakttv:anime-metadata'
};

module.exports = AnimeApi;
