// 模拟歌曲数据
const songsData = [];

// 自动读取 resource/data.json 文件
function loadJSONFile() {
    fetch('../resource/music.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载JSON文件');
            }
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                songsData.push(item);
            });
            initSingerSelect();
            filterSongs();
        })
        .catch(error => {
            console.error(error);
            alert('无法加载或解析JSON文件: ' + error.message);
        });
}

// 获取DOM元素
const songsList = document.getElementById('songsList');
const singerSelect = document.getElementById('singerSelect');
const scoreSelect = document.getElementById('scoreSelect');
const resetBtn = document.getElementById('resetBtn');
const pagination = document.getElementById('pagination');
const noResults = document.getElementById('noResults');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const mainPlayBtn = document.getElementById('mainPlayBtn');
const mainPlayIcon = document.getElementById('playIcon');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const nowPlayingTitle = document.querySelector('.now-playing-title');
const nowPlayingSinger = document.querySelector('.now-playing-singer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');

// 分页相关变量
let currentPage = 1;
const itemsPerPage = 5;
let filteredSongs = [];

// 播放相关变量
let isPlaying = false;
let currentSongIndex = -1;
let progressInterval;
let autoStopTimeout;
const listenTime = 9999;

function getSongSingersList(singerStr) {
    if (!singerStr) {
        return [];
    }
    const singers = [];
    // 检查是否包含组合格式 "组合名:成员1|成员2|成员3"
    if (singerStr.includes(':')) {
        const [groupName, members] = singerStr.split(':');
        singers.push(groupName.trim()); // 添加组合名
        // 添加所有成员
        if (members) {
            const memberList = members.split('|').map(m => m.trim()).filter(Boolean);
            singers.push(...memberList);
        }
    } else {
        // 普通格式，直接分割
        const singerList = singerStr.split('|').map(s => s.trim()).filter(Boolean);
        singers.push(...singerList);
    }
    return singers;
}

// 初始化歌手下拉框
function initSingerSelect() {
    // 获取所有不重复的歌手
    const singers = [...new Set(
        songsData.flatMap(song => {
            return getSongSingersList(song['singer']);
        })
    )];

    // 按字母顺序排序
    singers.sort();

    // 添加到下拉框
    singers.forEach(singer => {
        const option = document.createElement('option');
        option.value = singer;
        option.textContent = singer;
        singerSelect.appendChild(option);
    });
}

// 生成歌曲列表
function generateSongsList() {
    songsList.innerHTML = '';

    // 如果没有符合条件的歌曲
    if (filteredSongs.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    // 计算当前页的起始和结束索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredSongs.length);
    const currentPageSongs = filteredSongs.slice(startIndex, endIndex);

    currentPageSongs.forEach((song, index) => {
        const row = document.createElement('tr');

        // 计算全局排名
        const globalIndex = filteredSongs.findIndex(s => s.title === song.title);

        // 为前三名添加特殊样式
        if (globalIndex < 3) {
            row.classList.add('top-3');
        }

        // 如果是当前播放的歌曲，添加playing类
        if (globalIndex === currentSongIndex) {
            row.classList.add('playing');
        }

        // 计算评分对应的类名
        const scoreClass = `score-${Math.floor(song.score)}`;

        const singer = song.singer.split(':')[0];

        row.innerHTML = `
                    <td class="play-cell">
                        <div class="play-icon" data-index="${globalIndex}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3,2 L13,8 L3,14 Z"></path>
                            </svg>
                        </div>
                    </td>
                    <td class="title-cell">
                        <span class="rank-badge">${globalIndex + 1}</span>
                        ${song.title}
                    </td>
                    <td class="singer-cell">${singer}</td>
                    <td class="score-cell ${scoreClass}">${song.score}</td>
                    <td>
                        <button class="detail-btn">详情</button>
                    </td>
                `;

        songsList.appendChild(row);
    });

    // 为播放按钮添加事件监听器
    document.querySelectorAll('.play-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            playSong(index);
        });
    });

    document.querySelectorAll('.detail-btn').forEach(detail => {
        detail.addEventListener('click', function() {
           showAlertWithLink('提示', '该功能暂未实现');
        });
    });
}

// 生成分页控件
function generatePagination() {
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);

    if (totalPages <= 1) {
        return;
    }

    // 添加上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '&lt;';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            generateSongsList();
            generatePagination();
        }
    });
    pagination.appendChild(prevBtn);

    // 添加页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn';
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            generateSongsList();
            generatePagination();
        });
        pagination.appendChild(pageBtn);
    }

    // 添加下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '&gt;';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            generateSongsList();
            generatePagination();
        }
    });
    pagination.appendChild(nextBtn);

    // 添加页面信息
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    pagination.appendChild(pageInfo);
}

// 筛选歌曲
function filterSongs() {
    const selectedSinger = singerSelect.value;
    const selectedScore = scoreSelect.value;

    filteredSongs = songsData.filter(song => {
        let singers = new Set(getSongSingersList(song['singer']));
        // 按歌手筛选
        if (selectedSinger && !singers.has(selectedSinger)) {
            return false;
        }

        // 按评分筛选
        if (selectedScore) {
            const [min, max] = selectedScore.split('-').map(Number);
            if (max === 10) {
                if (song.score < min) return false;
            } else if (min === 0) {
                if (song.score >= 5) return false;
            } else {
                if (song.score < min || song.score >= max) return false;
            }
        }

        return true;
    });

    // 按评分排序
    filteredSongs.sort((a, b) => b.score - a.score);

    // 重置到第一页
    currentPage = 1;

    // 重新生成列表和分页
    generateSongsList();
    generatePagination();
}

// 重置筛选
function resetFilters() {
    singerSelect.value = '';
    scoreSelect.value = '';
    filterSongs();
}

function getSongUrl(song) {
    let music = song['music'];
    if (!music || music === '') {
        return '';
    }
    if (music.startsWith('wwy|')) {
        let id = music.slice(7);
        if (song['free']) {
            return 'https://music.163.com/song/media/outer/url?id=' + id;
        }
        else {
            return 'https://music.163.com/#/song?id=' + id;
        }
    }
    // else if (music.endsWith('www')) {
    //
    // }
    return music;
}

// 播放歌曲
function playSong(index) {
    // 更新播放器显示
    const song = filteredSongs[index];
    let musicUrl = getSongUrl(song);
    if (!song.free) {
        let htmlContent = '请前往地址<a href=\'' + musicUrl + '\' target=\'_blank\'>' + song.title + '</a>进行试听。'
        showAlertWithLink('该歌曲无法播放', htmlContent);
        return;
    }

    // 清除之前的自动停止计时器
    if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
    }

    // 如果点击的是当前正在播放的歌曲，则暂停/播放
    if (currentSongIndex === index) {
        togglePlayPause();
        return;
    }

    // 更新当前播放的歌曲索引
    currentSongIndex = index;

    nowPlayingTitle.textContent = song.title;
    nowPlayingSinger.textContent = song.singer;

    // 设置音频源并播放
    audioPlayer.src = musicUrl;
    audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayPauseIcons();
        generateSongsList(); // 重新生成列表以更新播放状态

        // 设置10秒后自动暂停
        autoStopTimeout = setTimeout(() => {
            pauseSong();
        }, listenTime * 1000);
    }).catch(error => {
        console.error('播放失败:', error);
    });

    // 更新进度条
    updateProgress();
}

// 切换播放/暂停
function togglePlayPause() {
    if (isPlaying) {
        pauseSong();
    } else {
        resumeSong();
    }
}

// 暂停歌曲
function pauseSong() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayPauseIcons();
    clearInterval(progressInterval);

    // 清除自动停止计时器
    if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
    }
}

// 恢复播放
function resumeSong() {
    audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayPauseIcons();
        updateProgress();

        // 重新设置10秒后自动暂停
        autoStopTimeout = setTimeout(() => {
            pauseSong();
        }, listenTime * 1000);
    }).catch(error => {
        console.error('播放失败:', error);
    });
}

// 更新播放/暂停图标
function updatePlayPauseIcons() {
    if (isPlaying) {
        playPauseIcon.setAttribute('d', 'M4,2 L4,14 L12,8 Z M12,2 L12,14 L4,8 Z');
        mainPlayIcon.setAttribute('d', 'M4,2 L4,14 L12,8 Z M12,2 L12,14 L4,8 Z');
    } else {
        playPauseIcon.setAttribute('d', 'M3,2 L13,8 L3,14 Z');
        mainPlayIcon.setAttribute('d', 'M3,2 L13,8 L3,14 Z');
    }
}

// 更新进度条
function updateProgress() {
    clearInterval(progressInterval);

    progressInterval = setInterval(() => {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = percent + '%';

            // 更新时间显示
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            durationEl.textContent = formatTime(audioPlayer.duration);
        }
    }, 500);
}

// 格式化时间（秒 -> 分:秒）
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 播放上一首
function playPrev() {
    if (currentSongIndex <= 0) {
        currentSongIndex = filteredSongs.length - 1;
    } else {
        currentSongIndex--;
    }
    playSong(currentSongIndex);
}

// 播放下一首
function playNext() {
    if (currentSongIndex >= filteredSongs.length - 1) {
        currentSongIndex = 0;
    } else {
        currentSongIndex++;
    }
    playSong(currentSongIndex);
}

progressBar.addEventListener('click', function(e) {
    if (!audioPlayer.duration) {
        return;
    }
    // 计算点击位置相对于进度条的百分比
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;

    // 设置音频当前时间
    audioPlayer.currentTime = percent * audioPlayer.duration;

    // 更新进度条显示
    progress.style.width = (percent * 100) + '%';
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
});

// 初始化
function init() {
    loadJSONFile();
    // 添加事件监听器
    singerSelect.addEventListener('change', filterSongs);
    scoreSelect.addEventListener('change', filterSongs);
    resetBtn.addEventListener('click', resetFilters);
    playPauseBtn.addEventListener('click', togglePlayPause);
    mainPlayBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);

    // 音频结束时自动播放下一首
    audioPlayer.addEventListener('ended', playNext);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 独立函数：显示带可点击链接的自定义弹窗
function showAlertWithLink(title, htmlContent) {
    // 创建弹窗容器
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';

    // 创建弹窗HTML结构
    overlay.innerHTML = `
                <div class="custom-alert">
                    <div class="custom-alert-header">
                        <h3 class="custom-alert-title">${title}</h3>
                        <button class="custom-alert-close">&times;</button>
                    </div>
                    <div class="custom-alert-body">${htmlContent}</div>
                    <div class="custom-alert-footer">
                        <button class="custom-alert-btn">确定</button>
                    </div>
                </div>
            `;

    // 添加到页面
    document.body.appendChild(overlay);

    // 关闭弹窗函数
    const closeAlert = () => {
        overlay.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    };

    // 添加事件监听
    overlay.querySelector('.custom-alert-close').addEventListener('click', closeAlert);
    overlay.querySelector('.custom-alert-btn').addEventListener('click', closeAlert);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAlert();
    });

    // 添加ESC键关闭功能
    const handleEscKey = (e) => {
        if (e.key === 'Escape') closeAlert();
    };
    document.addEventListener('keydown', handleEscKey);

    // 清理事件监听器
    overlay.addEventListener('click', function cleanup() {
        document.removeEventListener('keydown', handleEscKey);
        overlay.removeEventListener('click', cleanup);
    });
}