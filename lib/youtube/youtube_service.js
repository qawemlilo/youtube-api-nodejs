
const uri = require('urijs');
const request = require('request-promise-native');

class YoutubeService {

    /**
     * Expected params: {key, youtube baseuri}
     * @param params
     * @returns {*}
     */
    init(params) {
        if (!params.key) {
            return Promise.reject(new Error('Please pass youtube key'));
        }
        this._baseuri = params.baseuri || 'https://www.googleapis.com/youtube/v3/';
        this._key = params.key;

        return Promise.resolve(null);
    }

    /**
     * Get snippets of all videos from a channel
     * @param channelId
     * @returns {Promise|*}
     */
    fetchAllVideosFromChannel(channelId) {
        return this._fetchAllVideosFromChannel(channelId, [], null);
    }

    /**
     * Search api from youtube
     * @param params
     * @returns {*}
     */
    search(params) {
        params.key = this._key;

        const restUri = uri(this._baseuri)
            .filename('search')
            .query(params);

        return this._doRequest(restUri);
    }

    /**
     * Get details of a video
     * @param videoId
     * @param detailOptions (optional)
     *  Can be any one of: snippet, contentDetails, topicDetails statistics
     *  Can be all of them by comma separated
     */
    getVideoDetail(videoId, detailOptions) {
        const params = {
            key: this._key,
            id: videoId,
            part: detailOptions || 'snippet,contentDetails,topicDetails,statistics'
        };
        const restUri = uri(this._baseuri)
            .filename('videos')
            .query(params);

        return this._doRequest(restUri);
    }

    /**
     * List all videos from a playlist
     * @param playlistId
     * @returns {*}
     */
    listPlaylist(playlistId) {
        return this._fetchAllVideosFromPlaylist(playlistId, [], null);
    }

    /**
     * Get all comments(hierarchical) from a video
     * @param videoId
     */
    getAllCommentsForVideo(videoId) {
        return this._getComments(videoId, [], null);
    }

    _getComments(videoId, allComments, nextPageToken) {
        const params = {
            key: this._key,
            part: 'snippet,replies',
            videoId: videoId,
            maxResults: 10,
            pageToken: nextPageToken
        };

        const restUri = uri(this._baseuri)
            .filename('commentThreads')
            .query(params);

        return this._doRequest(restUri)
            .then((result) => {
                if (result && result.items && result.items.length > 0) {
                    allComments = allComments.concat(result.items);
                }

                if (result.nextPageToken) {
                    return this._getComments(videoId, allComments, result.nextPageToken);
                }
                else {
                    return allComments;
                }
            });
    }

    _doRequest(uri) {
        if (!uri) {
            return Promise.reject(new Error('Please pass uri'));
        }
        const requestParams = {
            uri: uri.toString(),
            json: true
        };
        return request(requestParams);
    }

    _fetchAllVideosFromChannel(channelId, allVideos, nextPageToken) {
        let params = {
            maxResults: 10,
            channelId: channelId,
            part: 'snippet',
            type: 'video',
            pageToken: nextPageToken
        };
        return this.search(params)
            .then((result) => {
                if (result && result.items && result.items.length > 0) {
                    allVideos = allVideos.concat(result.items);
                }

                if (result.nextPageToken) {
                    return this._fetchAllVideosFromChannel(channelId, allVideos, result.nextPageToken);
                }
                else {
                    return allVideos;
                }
            });
    }

    _fetchAllVideosFromPlaylist(playlistId, allVideos, nextPageToken) {
        let params = {
            maxResults: 10,
            playlistId: playlistId,
            part: 'snippet',
            type: 'video',
            pageToken: nextPageToken
        };
        return this.search(params)
            .then((result) => {
                if (result && result.items && result.items.length > 0) {
                    allVideos = allVideos.concat(result.items);
                }

                if (result.nextPageToken) {
                    return this._fetchAllVideosFromPlaylist(playlistId, allVideos, result.nextPageToken);
                }
                else {
                    return allVideos;
                }
            });
    }
}

module.exports = new YoutubeService();
