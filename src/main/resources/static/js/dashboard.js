// DOM 요소 참조
const modal = document.getElementById('trackingModal');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

// 택배사 코드 매핑
const carrierCodes = {
    '01': '우체국택배',
    '04': 'CJ대한통운',
    '05': '한진택배',
    '06': '로젠택배',
    '08': '롯데택배'
};

// 상태 한글 매핑
const statusMapping = {
    'RECEIVED': '접수',
    'IN_TRANSIT': '배송 중',
    'DELIVERED': '배송 완료'
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadDashboardData();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 모달 닫기 버튼
    closeModalBtn.addEventListener('click', closeModal);

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // 검색 버튼 클릭
    searchBtn.addEventListener('click', handleSearch);

    // 검색 입력 필드에서 Enter 키
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 상세 보기 버튼들 이벤트 위임
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('detail-btn')) {
            const trackingNumber = e.target.getAttribute('data-tracking');
            showTrackingDetail(trackingNumber);
        }
    });
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        // 통계 데이터 로드
        const response = await fetch('/api/v1/dashboard/stats');
        if (response.ok) {
            const stats = await response.json();
            updateDashboardStats(stats);
        }

        // 최근 운송장 목록 로드
        loadRecentTrackings();
    } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
    }
}

// 대시보드 통계 업데이트
function updateDashboardStats(stats) {
    // 통계 카드 업데이트 로직
    const totalElement = document.querySelector('[th\\:text="${totalCount ?: 0}"]');
    const receivedElement = document.querySelector('[th\\:text="${receivedCount ?: 0}"]');
    const inTransitElement = document.querySelector('[th\\:text="${inTransitCount ?: 0}"]');
    const deliveredElement = document.querySelector('[th\\:text="${deliveredCount ?: 0}"]');

    if (totalElement) totalElement.textContent = stats.total || 0;
    if (receivedElement) receivedElement.textContent = stats.received || 0;
    if (inTransitElement) inTransitElement.textContent = stats.inTransit || 0;
    if (deliveredElement) deliveredElement.textContent = stats.delivered || 0;
}

// 최근 운송장 목록 로드
async function loadRecentTrackings() {
    try {
        const response = await fetch('/api/v1/trackings/recent');
        if (response.ok) {
            const trackings = await response.json();
            renderTrackingTable(trackings);
        }
    } catch (error) {
        console.error('최근 운송장 목록 로드 실패:', error);
    }
}

// 운송장 테이블 렌더링
function renderTrackingTable(trackings) {
    const tbody = document.getElementById('trackingTableBody');
    tbody.innerHTML = '';

    trackings.forEach(tracking => {
        const row = createTrackingRow(tracking);
        tbody.appendChild(row);
    });
}

// 운송장 행 생성
function createTrackingRow(tracking) {
    const row = document.createElement('tr');

    // 상태 배지 생성
    const statusBadge = createStatusBadge(tracking.status);

    // 택배사 이름 변환
    const carrierName = carrierCodes[tracking.carrierCode] || '알 수 없음';

    // 날짜 포맷팅
    const formattedDate = formatDateTime(tracking.createdAt);

    row.innerHTML = `
        <td class="py-4 pr-4">${statusBadge}</td>
        <td class="py-4 pr-4 text-sm text-[var(--text-secondary-color)]">${tracking.trackingNumber}</td>
        <td class="py-4 pr-4 text-sm text-[var(--text-secondary-color)]">${carrierName}</td>
        <td class="py-4 pr-4 text-sm text-[var(--text-secondary-color)]">${formattedDate}</td>
        <td class="py-4 pr-4 text-right">
            <button class="detail-btn text-sm font-medium text-[var(--primary-color)] hover:underline" 
                    data-tracking="${tracking.trackingNumber}">상세 보기</button>
        </td>
    `;

    return row;
}

// 상태 배지 생성
function createStatusBadge(status) {
    const statusText = statusMapping[status] || status;
    let badgeClass = 'status-badge ';

    switch (status) {
        case 'RECEIVED':
            badgeClass += 'received';
            break;
        case 'IN_TRANSIT':
            badgeClass += 'in-transit';
            break;
        case 'DELIVERED':
            badgeClass += 'delivered';
            break;
        default:
            badgeClass += 'received';
    }

    return `<span class="${badgeClass}">${statusText}</span>`;
}

// 검색 처리
async function handleSearch() {
    const trackingNumber = searchInput.value.trim();
    if (!trackingNumber) {
        alert('운송장 번호를 입력해주세요.');
        return;
    }

    showTrackingDetail(trackingNumber);
}

// 운송장 상세 정보 표시
async function showTrackingDetail(trackingNumber) {
    openModal();
    showLoading();

    try {
        const response = await fetch(`/api/v1/trackings/${trackingNumber}`);

        if (response.ok) {
            const trackingData = await response.json();
            renderTrackingDetail(trackingData);
        } else if (response.status === 404) {
            showError('운송장을 찾을 수 없습니다.');
        } else {
            showError('운송장 조회 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('운송장 조회 실패:', error);
        showError('네트워크 오류가 발생했습니다.');
    }
}

// 운송장 상세 정보 렌더링
function renderTrackingDetail(data) {
    const carrierName = carrierCodes[data.carrierCode] || '알 수 없음';
    const currentStatus = statusMapping[data.currentStatus] || data.currentStatus;

    modalContent.innerHTML = `
        <div class="mt-6">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold text-[var(--text-primary-color)] mb-4">운송장 정보</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <p class="text-[var(--text-secondary-color)]">운송장 번호</p>
                        <p class="text-[var(--text-primary-color)] font-medium">${data.trackingNumber}</p>
                    </div>
                    <div>
                        <p class="text-[var(--text-secondary-color)]">택배사</p>
                        <p class="text-[var(--text-primary-color)] font-medium">${carrierName}</p>
                    </div>
                    <div>
                        <p class="text-[var(--text-secondary-color)]">배송 상태</p>
                        <p class="text-[var(--text-primary-color)] font-medium flex items-center">
                            <span class="status-dot ${getStatusDotClass(data.currentStatus)}"></span>
                            ${currentStatus}
                        </p>
                    </div>
                    <div>
                        <p class="text-[var(--text-secondary-color)]">생성일</p>
                        <p class="text-[var(--text-primary-color)] font-medium">${formatDateTime(data.createdAt)}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <h2 class="text-lg font-semibold text-[var(--text-primary-color)] mb-4">배송 추적</h2>
            <div class="timeline">
                ${renderTrackingLogs(data.logs)}
            </div>
        </div>
        
        <div class="mt-8 pt-4 border-t border-[var(--border-color)] flex justify-end gap-3">
            <button onclick="loadTrackingDetail('${data.trackingNumber}')" 
                    class="flex items-center justify-center rounded-lg h-10 px-4 text-[var(--text-primary-color)] text-sm font-bold border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                <span class="material-icons text-base mr-2">refresh</span>
                새로고침
            </button>
            <button onclick="closeModal()" 
                    class="flex items-center justify-center rounded-lg h-10 px-4 bg-[var(--primary-color)] text-white text-sm font-bold hover:bg-opacity-90 transition-opacity">
                닫기
            </button>
        </div>
    `;
}

// 배송 로그 렌더링
function renderTrackingLogs(logs) {
    if (!logs || logs.length === 0) {
        return '<p class="text-[var(--text-secondary-color)]">배송 정보가 없습니다.</p>';
    }

    return logs.map(log => `
        <div class="timeline-item">
            <div class="timeline-dot ${getTimelineDotClass(log.status)}">
                <span class="material-icons text-sm">${getStatusIcon(log.status)}</span>
            </div>
            <div class="ml-4">
                <p class="text-[var(--text-primary-color)] font-semibold">${statusMapping[log.status] || log.status}</p>
                <p class="text-sm text-[var(--text-secondary-color)]">${formatDateTime(log.timestamp)}</p>
                ${log.description ? `<p class="text-sm text-[var(--text-secondary-color)]">${log.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// 상태별 점 클래스 반환
function getStatusDotClass(status) {
    switch (status) {
        case 'RECEIVED': return 'status-received';
        case 'IN_TRANSIT': return 'status-in-transit';
        case 'DELIVERED': return 'status-delivered';
        default: return 'status-received';
    }
}

// 타임라인 점 클래스 반환
function getTimelineDotClass(status) {
    switch (status) {
        case 'RECEIVED': return 'pending';
        case 'IN_TRANSIT': return 'in-progress';
        case 'DELIVERED': return 'completed';
        default: return 'pending';
    }
}

// 상태별 아이콘 반환
function getStatusIcon(status) {
    switch (status) {
        case 'RECEIVED': return 'inventory_2';
        case 'IN_TRANSIT': return 'local_shipping';
        case 'DELIVERED': return 'check';
        default: return 'info';
    }
}

// 모달 열기 (수정됨)
function openModal() {
    // 애니메이션 관련 'show' 클래스 및 setTimeout 제거
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 모달 닫기 (수정됨)
function closeModal() {
    // 애니메이션 관련 'show' 클래스 및 setTimeout 지연 제거
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// 로딩 표시
function showLoading() {
    modalContent.innerHTML = `
        <div class="mt-6 text-center py-8">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-[var(--text-secondary-color)]">운송장 정보를 조회하고 있습니다...</p>
        </div>
    `;
}

// 오류 표시
function showError(message) {
    modalContent.innerHTML = `
        <div class="mt-6 text-center py-8">
            <span class="material-icons text-red-500 text-4xl mb-4">error</span>
            <p class="text-[var(--text-secondary-color)]">${message}</p>
            <button onclick="closeModal()" 
                    class="mt-4 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-opacity-90">
                확인
            </button>
        </div>
    `;
}

// 날짜 시간 포맷팅
function formatDateTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 전역 함수들 (onclick 이벤트용)
window.loadTrackingDetail = function(trackingNumber) {
    showTrackingDetail(trackingNumber);
};

window.closeModal = closeModal;