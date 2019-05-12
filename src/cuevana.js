const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');
const url = require('url');

const getTopCatalog = async () => {
    const res = await cloudscraper.get('https://www.cuevana2.com/peliculas-destacadas/');
    const $ = cheerio.load(res);

    let movies = [];
    $('#list .list #post a').each((index, element) => {
        let $el = $(element);

        let movie = {
            type: 'movie',
            id: 'cu2_' + encodeURIComponent($el.attr('href')),
            name: $el.find('.box .tit span').text(),
            poster: $el.find('.img img').attr('src'),
            year: $el.find('.box .ano').text(),
            description: $el.find('.box .txt').text()
        }
        
        movies.push(movie);
    });

    return movies;
}

const searchMovies = async (searchTerm) => {
    const res = await cloudscraper.get('https://www.cuevana2.com/?s=' + encodeURIComponent(searchTerm));
    const $ = cheerio.load(res);

    let movies = [];
    $('#list .list li a').each((index, element) => {
        let $el = $(element);

        let movie = {
            type: 'movie',
            id: 'cu2_' + encodeURIComponent($el.attr('href')),
            name: $el.find('.box .tit span').text(),
            poster: $el.find('.img img').attr('src'),
            year: $el.find('.box .ano').text(),
            description: $el.find('.box .txt').text()
        }

        if(!movie.id.includes('pelicula')) {
            return; // not a movie
        }
        
        movies.push(movie);
    });

    return movies;
}

const getMovieMeta = async (movieId) => {
    const pageUrl = decodeURIComponent(movieId.substring(4));
    const res = await cloudscraper.get(pageUrl);
    const $ = cheerio.load(res);

    return {
        id: movieId,
        type: 'movie',
        name: $('#main-content .head .tit').text(),
        poster: $('#main-content .head .img img').attr('src'),
        year: $('#main-content .head .specs p').eq(1).text(),
        description: $('#tabs-2 p').first().text(),
        runtime: $('#main-content .head .specs p').eq(3).text()
    }
}

const getVideo = async (fileId) => {
    const res = await cloudscraper.post({
        uri: 'https://player4.cuevana2.com/plugins/gkpluginsphp.php',
        formData: { link: fileId }
    });

    const video = JSON.parse(res);

    if(video.type == 'mp4') {
        return video.link;
    } 

    return false;
}

const getMovieStreams = async (movieId) => {
    const pageUrl = decodeURIComponent(movieId.substring(4));
    const res = await cloudscraper.get(pageUrl);
    const $ = cheerio.load(res);

    let streams = [];
    let promises = [];

    $('.playertab .tabs li').each(async (index, element) => {
        let $el = $(element);

        let frameUrl = 'https:' + $el.attr('data-playerid');
        if(!frameUrl.startsWith('https://player4.cuevana2.com/index')) {
            return;
        }

        const queryParams = url.parse(frameUrl, true).query;
        const fileId = queryParams.file;
        const subUrl = queryParams.sub;
        
        const videoPromise = getVideo(fileId);
        promises.push(videoPromise);
        
        const videoUrl = await videoPromise;

        if(!videoUrl) {
            return;
        }

        let stream = {
            title: $el.find('a').text(),
            url: videoUrl,
            subtitles: [{
                url: subUrl, 
                lang: 'spa'
            }]
        }
        
        streams.push(stream);
    })
    
    await Promise.all(promises);
    console.log(JSON.stringify(streams));
    return streams;
    
}

module.exports = { getTopCatalog, getMovieMeta, getMovieStreams, searchMovies };