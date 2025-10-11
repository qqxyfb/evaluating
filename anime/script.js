// 获取评分图表容器
const scoreChart = document.querySelector('.score-chart');

// 自动读取 resource/data.json 文件
function loadJSONFile() {
    fetch('../resource/data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载JSON文件');
            }
            return response.json();
        })
        .then(data => {
            generateScoreChart(data); // 调用生成评分图表的函数
        })
        .catch(error => {
            console.error(error);
            alert('无法加载或解析JSON文件: ' + error.message);
        });
}

// 页面加载时自动读取JSON文件
window.onload = loadJSONFile;

// 生成评分图表
function generateScoreChart(data) {
    scoreChart.innerHTML = ''; // 清空之前的内容
    data =  data.sort((a, b) => b.score - a.score);
    // 创建分数段（10到1分），并将作品按分数放入相应段落
    for (let i = 9; i >= 1; i--) {
        const segment = document.createElement('div');
        segment.classList.add('score-segment');

        const scoreLabel = document.createElement('div');
        scoreLabel.classList.add('score-label');
        scoreLabel.textContent = `${i} 分`;
        segment.appendChild(scoreLabel);

        // 根据分数筛选属于该段的作品
        data.forEach(item => {
            if (Math.floor(item.score) === i) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item');

                const a = document.createElement('a');
                a.href = 'javascript:void(0)';
                a.onclick = function () {
                    const modal = document.getElementById("myModal");
                    const modalDescription = document.getElementById("modal-description");
                    // 设置弹窗中的说明内容
                    modalDescription.innerHTML = item.description;

                    // 显示弹窗
                    modal.style.display = "block";
                };
                const img = document.createElement('img');
                img.src = item.image.replaceAll("resource/img", "../resource/img");
                a.appendChild(img);
                itemDiv.appendChild(a);

                const nameDiv = document.createElement('div');
                nameDiv.classList.add('item-name-container');
                const nameText = document.createElement('div');
                nameText.classList.add('item-name-text');
                nameText.textContent = item.title;
                nameDiv.appendChild(nameText);
                itemDiv.appendChild(nameDiv);

                const scoreDiv = document.createElement('div');
                scoreDiv.classList.add('item-score');
                scoreDiv.textContent = `评分: ${item.score}`;
                itemDiv.appendChild(scoreDiv);

                segment.appendChild(itemDiv);
            }
        });

        scoreChart.appendChild(segment);
    }
    textScroll();
}

// 定义关闭弹窗的函数
function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
}

// 点击关闭按钮时触发的事件
document.getElementsByClassName("close")[0].onclick = function() {
    closeModal();
}

// 点击窗口外部时关闭弹窗
window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        closeModal();
    }
}

function textScroll() {
    const containers = document.querySelectorAll('.item-name-container');
    containers.forEach(container => {
        const text = container.querySelector('.item-name-text');
        // 如果文本宽度 > 容器宽度，则添加scrolling类
        if (text.scrollWidth > 120) {
            text.classList.add('scrolling');
            // 根据文本长度调整动画时间
            const textLength = text.scrollWidth;
            const baseDuration = 10; // 基础12秒
            const extraDuration = Math.max(0, (textLength - 120) / 50); // 每50px额外增加1秒
            const totalDuration = baseDuration + extraDuration;
            
            text.style.animationDuration = `${totalDuration}s`;
        }
    });
}