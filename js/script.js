// Search for playlist and songs using spotify api

/* Handling events */

(() => {
    const genreSelect = document.getElementById('genre');
    const playlistSelect = document.getElementById('playlist');
    const searchForm = document.getElementById('search_music');
    const btnSearch = document.getElementById('btnSearch');

    // populate the genres list on document load
    document.addEventListener('load', populateGenreSelect());

    genreSelect.addEventListener('change', function () {
        const indexSelected = this.selectedIndex;

        if (indexSelected < 1) {
            return;
        }

        populatePlaylistSelect(this.options[indexSelected].value);
    });

    playlistSelect.addEventListener('change', function () {
        if (this.selectedIndex > 0) {
            btnSearch.disabled = null;
        } else {
            btnSearch.disabled = true;
        }
    });

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (playlistSelect.selectedIndex < 1) {
            return;
        }

        const playlistName =
            playlistSelect.options[playlistSelect.selectedIndex].value;
        const categoryName =
            genreSelect.options[genreSelect.selectedIndex].value;

        populateTracksList(categoryName, playlistName);
    });
})();

/* DOM Manipulation */

function populateGenreSelect() {
    const genreSelect = document.getElementById('genre');

    // if it's already populated no need to do it again
    if (genreSelect.options.length > 1) {
        return;
    }

    (async () => {
        const genres = await getCategories();

        const namesOfGenres = Array.from(genres).map((genre) => genre.name);

        namesOfGenres.forEach((name) => {
            const option = document.createElement('option');
            option.setAttribute('value', name);
            option.textContent = name;
            genreSelect.appendChild(option);
        });
    })();
}

function populatePlaylistSelect(categoryName) {
    if (!categoryName) {
        return;
    }

    const playlistSelect = document.getElementById('playlist');
    playlistSelect.innerHTML = `<option value="">Select...</option>`;

    (async () => {
        const categoryId = await getCategoryId(categoryName);
        const playlists = await getPlaylistByCategory(categoryId);

        Array.from(playlists).forEach((pl) => {
            const option = document.createElement('option');
            option.setAttribute('value', pl.name);
            option.textContent = pl.name;
            playlistSelect.appendChild(option);
        });
    })();
}

function populateTracksList(categoryName, playlistName) {
    // const playlistSelect = document.getElementById('playlist');
    const tracksDiv = document.getElementById('tracks');

    tracksDiv.innerHTML = '';

    (async () => {
        const playlist = await getPlaylist(categoryName, playlistName);
        const tracks = await getTracksFromPlaylist(playlist);

        Array.from(tracks).forEach((item) => {
            const div = document.createElement('div');
            div.classList.add('track');
            div.setAttribute('id', item.track.id);
            div.textContent = `${item.track.name} ~ ${artistsToString(item.track.artists)}`;
            div.addEventListener('click', function () {
                viewTrack(this.id);
            });
            tracksDiv.appendChild(div);
        });
    })();
}

function viewTrack(trackId) {
    const viewDiv = document.getElementById('viewTrack');
    const divImage = document.getElementById('image');
    const divInfo = document.getElementById('info');

    viewDiv.style.display = 'flex';

    function mostrarThumbnail(imageUrl) {
        divImage.innerHTML = '';
        const image = document.createElement('img');
        image.setAttribute('src', imageUrl);
        image.setAttribute('width', 120);
        image.setAttribute('height', 120);
        divImage.appendChild(image);
    }

    function mostrarInfo(track) {
        divInfo.innerHTML = '';

        const title = document.createElement('div');
        title.classList.add('bold');

        const linkToTrack = document.createElement('a');
        linkToTrack.setAttribute('href', track.external_urls.spotify);
        linkToTrack.setAttribute('target', '_blank');
        linkToTrack.textContent = `${track.name}`;

        title.appendChild(linkToTrack);
        divInfo.appendChild(title);

        const artist = document.createElement('div');
        artist.classList.add('artist-name');

        const linkToArtist = document.createElement('a');
        linkToArtist.setAttribute(
            'href',
            track.artists[0].external_urls.spotify,
        );
        linkToArtist.setAttribute('target', '_blank');
        linkToArtist.textContent = `${artistsToString(track.artists)}`;

        artist.appendChild(linkToArtist);
        divInfo.appendChild(artist);
    }

    (async () => {
        const track = await getTrackById(trackId);

        mostrarThumbnail(track.album.images[0].url);
        mostrarInfo(track);
    })();
}

/* Interacting with the Spotify API */

async function getTracksFromPlaylist(playlist) {
    const limit = 10;
    const uri = `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=${limit}`;
    const token = await getToken();

    const response = await fetch(uri, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();
    return data.items;
}

async function getPlaylistByCategory(categoryId) {
    const limit = 10;
    const uri = `https://api.spotify.com/v1/browse/categories/${categoryId}/playlists?limit=${limit}`;
    const token = await getToken();

    const response = await fetch(uri, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();
    return data.playlists.items;
}

async function getCategories() {
    const limit = 10;
    const uri = `https://api.spotify.com/v1/browse/categories?limit=${limit}`;
    const token = await getToken();

    const response = await fetch(uri, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    return data.categories.items;
}

async function getCategoryId(categoryName) {
    const categories = await getCategories();
    const filtered = Array.from(categories).filter(
        (cat) => cat.name === categoryName,
    );

    if (filtered) {
        return filtered[0].id;
    }

    return false;
}

async function getTrackById(id) {
    const uri = `https://api.spotify.com/v1/tracks/${id}`;
    const token = await getToken();

    const response = await fetch(uri, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();
    return data;
}

async function getPlaylist(categoryName, playlistName) {
    const categoryId = await getCategoryId(categoryName);
    const playlists = await getPlaylistByCategory(categoryId);
    const filtered = Array.from(playlists).filter(
        (pl) => pl.name === playlistName,
    );

    if (filtered) {
        return filtered[0];
    }

    return false;
}

async function getToken() {
    const clientId = '8cbde973f7c4433fa02e21d93b0621a5';
    const clientSecret = 'de3c1353f5554f3a986d25a03450e6de';
    const uri = 'https://accounts.spotify.com/api/token';

    const response = await fetch(uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    const data = await response.json();
    return data.access_token;
}

/* Helper Functions */

function artistsToString(artists) {
    return artists.map((artist) => artist.name).join(', ');
}
