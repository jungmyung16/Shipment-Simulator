// DOM 요소 참조
const modal = document.getElementById('trackingModal');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const trackingTableBody = document.getElementById('trackingTableBody');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const tableLoadingSpinner = document.getElementById('table-loading-spinner');

// 상태 관리 변수
let currentPage = 0;
let totalPages = 1;

// 택배사 코드 매핑
const carrierCodes = {
    '01': '우체국택배',
    '04': 'CJ대한통운',
    '05': '한진택배',
    '06': '로젠택배',
    '08': '롯데택배'
};

// 배송 상태 한글 매핑
const deliveryStatusMap = {
    'PICKED_UP': '물품 접수 완료',
    'AT_SORT_HUB': '물류센터 도착',
    'DEPARTED_HUB': '물류센터 출발',
    'OUT_FOR_DELIVERY': '배송지 근처 도착',
    'DELIVERED': '배송 완료'
};

// 상태 요약 매핑
const statusSummaryMap = {
    'PICKED_UP': '접수',
    'AT_SORT_HUB': '배송 중',
    'DEPARTED_HUB': '배송 중',
    'OUT_FOR_DELIVERY': '배송 중',
    'DELIVERED': '배송 완료'
};


// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    // Thymeleaf에서 전달받은 초기 페이지 데이터로 상태 설정
    currentPage = initialPageData.currentPage;
    totalPages = initialPageData.totalPages;
    updatePaginationControls();

    initializeEventListeners();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => (e.target === modal) && closeModal());
    document.addEventListener('keydown', (e) => (e.key === 'Escape' && !modal.classList.contains('hidden')) && closeModal());
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => (e.key === 'Enter') && handleSearch());
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            loadRecentTrackings(currentPage - 1);
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            loadRecentTrackings(currentPage + 1);
        }
    });
    // 이벤트 위임을 사용하여 동적으로 생성된 '상세 보기' 버튼 처리
    document.getElementById('trackingTableBody').addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('detail-btn')) {
            const trackingNumber = e.target.getAttribute('data-tracking');
            showTrackingDetail(trackingNumber);
        }
    });
}

// 최근 운송장 목록 비동기 로드 (페이지네이션)
async function loadRecentTrackings(page) {
    showTableLoading(true);
    try {
        const response = await fetch(`/api/v1/trackings/active?page=${page}&size=10`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pageData = await response.json();
        currentPage = pageData.number;
        totalPages = pageData.totalPages;
        renderTrackingTable(pageData.content);
        updatePaginationControls();
    } catch (error) {
        console.error('최근 운송장 목록 로드 실패:', error);
        trackingTableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-red-500">목록을 불러오는데 실패했습니다.</td></tr>`;
    } finally {
        showTableLoading(false);
    }
}

// 운송장 테이블 렌더링
function renderTrackingTable(trackings) {
    trackingTableBody.innerHTML = ''; // 테이블 비우기

    if (!trackings || trackings.length === 0) {
        trackingTableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-sm text-[var(--text-secondary-color)]">활성 운송장이 없습니다.</td></tr>`;
        return;
    }

    const rowsHtml = trackings.map(tracking => createTrackingRow(tracking)).join('');
    trackingTableBody.innerHTML = rowsHtml;
}

// 운송장 테이블 행 HTML 생성
function createTrackingRow(tracking) {
    const carrierName = carrierCodes[tracking.carrierCode] || '알 수 없음';
    const formattedDate = formatDateTime(tracking.createdAt);
    const statusBadge = createStatusBadge(tracking.currentStatus);

    return `
        <tr class="fade-in">
            <td class="py-4 pr-4">${statusBadge}</td>
            <td class="py-4 pr-4 text-sm text-[var(--text-secondary-color)]">${tracking.trackingNumber}</td>
            <td class="py-4 pr-4 text-sm text-[var(--text-secondary-color)]">${carrierName}</td>
            <td class="py-4 pr-4 text-sm text-[var(--text-secondary-color)]">${formattedDate}</td>
            <td class="py-4 pr-4 text-right">
                <button class="detail-btn text-sm font-medium text-[var(--primary-color)] hover:underline" 
                        data-tracking="${tracking.trackingNumber}">상세 보기</button>
            </td>
        </tr>
    `;
}

// 상태 배지 HTML 생성
function createStatusBadge(status) {
    const statusText = statusSummaryMap[status] || '알 수 없음';
    let badgeClass = 'status-badge ';

    switch (status) {
        case 'PICKED_UP':
            badgeClass += 'received';
            break;
        case 'DELIVERED':
            badgeClass += 'delivered';
            break;
        default: // AT_SORT_HUB, DEPARTED_HUB, OUT_FOR_DELIVERY
            badgeClass += 'in-transit';
            break;
    }
    return `<span class="${badgeClass}">${statusText}</span>`;
}

// 페이지네이션 컨트롤 업데이트
function updatePaginationControls() {
    currentPageSpan.textContent = totalPages > 0 ? currentPage + 1 : 0;
    totalPagesSpan.textContent = totalPages > 0 ? totalPages : 0;
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage >= totalPages - 1;

    // TailwindCSS의 disabled 스타일을 위해 클래스 토글
    prevPageBtn.classList.toggle('disabled', prevPageBtn.disabled);
    nextPageBtn.classList.toggle('disabled', nextPageBtn.disabled);
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
    showModalLoading();

    try {
        const response = await fetch(`/api/v1/trackings/${trackingNumber}`);
        if (response.ok) {
            const trackingData = await response.json();
            renderTrackingDetail(trackingData);
        } else if (response.status === 404) {
            showModalError('운송장을 찾을 수 없습니다.');
        } else {
            showModalError('운송장 조회 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('운송장 조회 실패:', error);
        showModalError('네트워크 오류가 발생했습니다.');
    }
}

// 운송장 상세 정보 렌더링
function renderTrackingDetail(data) {
    const carrierName = carrierCodes[data.carrierCode] || '알 수 없음';
    const currentStatus = deliveryStatusMap[data.currentStatus] || data.currentStatus;

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
                        <p class="text-[var(--text-secondary-color)]">등록일</p>
                        <p class="text-[var(--text-primary-color)] font-medium">${formatDateTime(data.createdAt)}</p>
                    </div>
                     ${data.deliveredAt ? `
                    <div>
                        <p class="text-[var(--text-secondary-color)]">배송 완료일</p>
                        <p class="text-[var(--text-primary-color)] font-medium">${formatDateTime(data.deliveredAt)}</p>
                    </div>` : ''}
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <h2 class="text-lg font-semibold text-[var(--text-primary-color)] mb-4">배송 추적</h2>
            <div class="timeline">
                ${renderTrackingLogs(data.logs, data.currentStatus)}
            </div>
        </div>
    `;
}

// 배송 로그 렌더링
function renderTrackingLogs(logs, currentStatus) {
    if (!logs || logs.length === 0) {
        return '<p class="text-[var(--text-secondary-color)]">배송 정보가 없습니다.</p>';
    }

    // 로그를 시간 역순으로 정렬하여 최신순으로 표시
    const sortedLogs = logs.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return sortedLogs.map((log, index) => {
        // 첫 번째 로그(가장 최신)가 현재 상태와 동일한지 확인
        const isCurrent = (index === 0 && log.status === currentStatus);
        return `
            <div class="timeline-item">
                <div class="timeline-dot ${getTimelineDotClass(log.status, isCurrent)}">
                    <span class="material-icons text-sm">${getStatusIcon(log.status)}</span>
                </div>
                <div class="ml-4">
                    <p class="font-semibold ${isCurrent ? 'text-[var(--primary-color)]' : 'text-[var(--text-primary-color)]'}">
                        ${deliveryStatusMap[log.status] || log.status}
                    </p>
                    <p class="text-sm text-[var(--text-secondary-color)]">${log.description}</p>
                    <p class="text-sm text-[var(--text-secondary-color)]">${formatDateTime(log.timestamp)}</p>
                </div>
            </div>
        `
    }).join('');
}

// 상태별 점 클래스 반환
function getStatusDotClass(status) {
    if (status === 'DELIVERED') return 'status-delivered';
    if (['AT_SORT_HUB', 'DEPARTED_HUB', 'OUT_FOR_DELIVERY'].includes(status)) return 'status-in-transit';
    return 'status-received';
}

// 타임라인 점 클래스 반환
function getTimelineDotClass(status, isCurrent) {
    if (isCurrent) return 'in-progress'; // 현재 진행 중인 최신 상태
    if (status === 'DELIVERED') return 'completed'; // 완료된 상태
    return 'pending'; // 이전 상태들
}

// 상태별 아이콘 반환
function getStatusIcon(status) {
    switch (status) {
        case 'PICKED_UP': return 'inventory_2';
        case 'AT_SORT_HUB': return 'maps_home_work';
        case 'DEPARTED_HUB': return 'local_shipping';
        case 'OUT_FOR_DELIVERY': return 'directions_bike';
        case 'DELIVERED': return 'check_circle';
        default: return 'info';
    }
}


// 모달 제어
function openModal() {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// 로딩 및 오류 표시
function showModalLoading() {
    modalContent.innerHTML = `<div class="mt-6 text-center py-8"><div class="loading-spinner mx-auto mb-4"></div><p>운송장 정보를 조회하고 있습니다...</p></div>`;
}

function showModalError(message) {
    modalContent.innerHTML = `<div class="mt-6 text-center py-8"><span class="material-icons text-red-500 text-4xl mb-4">error</span><p>${message}</p></div>`;
}

function showTableLoading(isLoading) {
    tableLoadingSpinner.classList.toggle('hidden', !isLoading);
}


// 유틸리티 함수
function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}