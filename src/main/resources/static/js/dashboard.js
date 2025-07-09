// DOM 요소 참조
const modal = document.getElementById('trackingModal');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const createModal = document.getElementById('createModal');
const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const createShipmentBtn = document.getElementById('createShipmentBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const carrierSelect = document.getElementById('carrierSelect');

const deleteConfirmInput = document.getElementById('deleteConfirmInput');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteTrackingNumberText = document.getElementById('deleteTrackingNumberText');

const trackingTableBody = document.getElementById('trackingTableBody');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const tableLoadingSpinner = document.getElementById('table-loading-spinner');

// 상태 관리 변수
let currentPage = 0;
let totalPages = 1;
let currentDeleteTrackingNumber = '';

// 택배사 코드 매핑
const carrierCodes = {'01': '우체국택배', '04': 'CJ대한통운', '05': '한진택배', '06': '로젠택배', '08': '롯데택배'};
// 배송 상태 한글 매핑
const deliveryStatusMap = {'PICKED_UP': '물품 접수 완료', 'AT_SORT_HUB': '물류센터 도착', 'DEPARTED_HUB': '물류센터 출발', 'OUT_FOR_DELIVERY': '배송지 근처 도착', 'DELIVERED': '배송 완료'};
// 상태 요약 매핑
const statusSummaryMap = {'PICKED_UP': '접수', 'AT_SORT_HUB': '배송 중', 'DEPARTED_HUB': '배송 중', 'OUT_FOR_DELIVERY': '배송 중', 'DELIVERED': '배송 완료'};


// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    currentPage = initialPageData.currentPage;
    totalPages = initialPageData.totalPages;
    if (!initialPageData.isEmpty) {
        renderTrackingTable(initialTrackings);
    }
    updatePaginationControls();
    initializeEventListeners();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 상세 조회 모달
    closeModalBtn.addEventListener('click', () => toggleModal('trackingModal', false));
    modal.addEventListener('click', (e) => (e.target === modal) && toggleModal('trackingModal', false));

    // 생성 모달
    createShipmentBtn.addEventListener('click', () => toggleModal('createModal', true));
    closeCreateModalBtn.addEventListener('click', () => toggleModal('createModal', false));
    createModal.addEventListener('click', (e) => (e.target === createModal) && toggleModal('createModal', false));
    confirmCreateBtn.addEventListener('click', handleCreateShipment);

    // 삭제 모달
    closeDeleteModalBtn.addEventListener('click', () => toggleModal('deleteModal', false));
    deleteModal.addEventListener('click', (e) => (e.target === deleteModal) && toggleModal('deleteModal', false));
    deleteConfirmInput.addEventListener('input', () => {
        confirmDeleteBtn.disabled = deleteConfirmInput.value !== currentDeleteTrackingNumber;
    });
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);


    // 공통
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            !modal.classList.contains('hidden') && toggleModal('trackingModal', false);
            !createModal.classList.contains('hidden') && toggleModal('createModal', false);
            !deleteModal.classList.contains('hidden') && toggleModal('deleteModal', false);
        }
    });

    // 검색
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => (e.key === 'Enter') && handleSearch());

    // 페이지네이션
    prevPageBtn.addEventListener('click', () => (currentPage > 0) && loadRecentTrackings(currentPage - 1));
    nextPageBtn.addEventListener('click', () => (currentPage < totalPages - 1) && loadRecentTrackings(currentPage + 1));

    // 이벤트 위임 (상세보기, 삭제, 상태변경)
    document.body.addEventListener('click', (e) => {
        if (e.target) {
            if (e.target.classList.contains('detail-btn')) {
                showTrackingDetail(e.target.getAttribute('data-tracking'));
            } else if (e.target.classList.contains('delete-btn')) {
                handleDeleteClick(e.target.getAttribute('data-tracking'));
            } else if (e.target.id === 'manualLogBtn') {
                handleManualLogGeneration(e.target.getAttribute('data-tracking'));
            }
        }
    });
}

// 최근 운송장 목록 비동기 로드
async function loadRecentTrackings(page = 0) {
    showTableLoading(true);
    try {
        const response = await fetch(`/api/v1/trackings/active?page=${page}&size=10`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
    trackingTableBody.innerHTML = '';
    if (!trackings || trackings.length === 0) {
        trackingTableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-sm text-[var(--text-secondary-color)]">활성 운송장이 없습니다.</td></tr>`;
        return;
    }
    const rowsHtml = trackings.map(createTrackingRow).join('');
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
                <button class="detail-btn text-sm font-medium text-[var(--primary-color)] hover:underline" data-tracking="${tracking.trackingNumber}">상세 보기</button>
                <button class="delete-btn text-sm font-medium text-red-600 hover:underline ml-4" data-tracking="${tracking.trackingNumber}">삭제</button>
            </td>
        </tr>`;
}

// 상태 배지 HTML 생성
function createStatusBadge(status) {
    const statusText = statusSummaryMap[status] || '알 수 없음';
    let badgeClass = 'status-badge ';
    switch (status) {
        case 'PICKED_UP': badgeClass += 'received'; break;
        case 'DELIVERED': badgeClass += 'delivered'; break;
        default: badgeClass += 'in-transit'; break;
    }
    return `<span class="${badgeClass}">${statusText}</span>`;
}

// 페이지네이션 컨트롤 업데이트
function updatePaginationControls() {
    currentPageSpan.textContent = totalPages > 0 ? currentPage + 1 : 0;
    totalPagesSpan.textContent = totalPages > 0 ? totalPages : 0;
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage >= totalPages - 1;
    prevPageBtn.classList.toggle('disabled', prevPageBtn.disabled);
    nextPageBtn.classList.toggle('disabled', nextPageBtn.disabled);
}

// 검색 처리
async function handleSearch() {
    const trackingNumber = searchInput.value.trim();
    if (!trackingNumber) { alert('운송장 번호를 입력해주세요.'); return; }
    showTrackingDetail(trackingNumber);
}

// 운송장 상세 정보 표시
async function showTrackingDetail(trackingNumber) {
    toggleModal('trackingModal', true);
    showModalLoading(modalContent, '운송장 정보를 조회하고 있습니다...');
    try {
        const response = await fetch(`/api/v1/trackings/${trackingNumber}`);
        if (response.ok) {
            const trackingData = await response.json();
            renderTrackingDetail(trackingData);
        } else if (response.status === 404) {
            showModalError(modalContent, '운송장을 찾을 수 없습니다.');
        } else {
            showModalError(modalContent, '운송장 조회 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('운송장 조회 실패:', error);
        showModalError(modalContent, '네트워크 오류가 발생했습니다.');
    }
}

// 운송장 상세 정보 렌더링
function renderTrackingDetail(data) {
    const carrierName = carrierCodes[data.carrierCode] || '알 수 없음';
    const currentStatus = deliveryStatusMap[data.currentStatus] || data.currentStatus;
    const isDelivered = data.currentStatus === 'DELIVERED';

    let buttonsHtml = '';
    if (!isDelivered) {
        buttonsHtml = `
            <button id="manualLogBtn" data-tracking="${data.trackingNumber}" class="bg-green-600 text-white flex items-center justify-center gap-2 rounded-[var(--border-radius)] px-4 py-2 font-bold shadow-sm transition-transform hover:scale-105 text-sm">
                <span class="material-icons text-base">update</span>
                <span>배송 상태 수동 변경</span>
            </button>`;
    }

    modalContent.innerHTML = `
        <div class="mt-6 flex justify-between items-center">
             <h2 class="text-lg font-semibold text-[var(--text-primary-color)]">운송장 정보</h2>
             <div>${buttonsHtml}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-6 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div><p class="text-[var(--text-secondary-color)]">운송장 번호</p><p class="text-[var(--text-primary-color)] font-medium">${data.trackingNumber}</p></div>
                <div><p class="text-[var(--text-secondary-color)]">택배사</p><p class="text-[var(--text-primary-color)] font-medium">${carrierName}</p></div>
                <div><p class="text-[var(--text-secondary-color)]">배송 상태</p><p class="text-[var(--text-primary-color)] font-medium flex items-center"><span class="status-dot ${getStatusDotClass(data.currentStatus)}"></span>${currentStatus}</p></div>
                <div><p class="text-[var(--text-secondary-color)]">등록일</p><p class="text-[var(--text-primary-color)] font-medium">${formatDateTime(data.createdAt)}</p></div>
                ${data.deliveredAt ? `<div><p class="text-[var(--text-secondary-color)]">배송 완료일</p><p class="text-[var(--text-primary-color)] font-medium">${formatDateTime(data.deliveredAt)}</p></div>` : ''}
            </div>
        </div>
        <div class="mt-6"><h2 class="text-lg font-semibold text-[var(--text-primary-color)] mb-4">배송 추적</h2><div class="timeline">${renderTrackingLogs(data.logs, data.currentStatus)}</div></div>`;
}


// 배송 로그 렌더링
function renderTrackingLogs(logs, currentStatus) {
    if (!logs || logs.length === 0) return '<p class="text-[var(--text-secondary-color)]">배송 정보가 없습니다.</p>';
    const sortedLogs = logs.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sortedLogs.map((log, index) => {
        const isCurrent = (index === 0 && log.status === currentStatus);
        return `
            <div class="timeline-item"><div class="timeline-dot ${getTimelineDotClass(log.status, isCurrent)}"><span class="material-icons text-sm">${getStatusIcon(log.status)}</span></div>
                <div class="ml-4">
                    <p class="font-semibold ${isCurrent ? 'text-[var(--primary-color)]' : 'text-[var(--text-primary-color)]'}">${deliveryStatusMap[log.status] || log.status}</p>
                    <p class="text-sm text-[var(--text-secondary-color)]">${log.description}</p>
                    <p class="text-sm text-[var(--text-secondary-color)]">${formatDateTime(log.timestamp)}</p>
                </div>
            </div>`;
    }).join('');
}

// 운송장 생성 처리
async function handleCreateShipment() {
    const carrierCode = carrierSelect.value;
    try {
        const response = await fetch('/api/v1/trackings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ carrierCode })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        toggleModal('createModal', false);
        await loadRecentTrackings(0); // 첫 페이지로 갱신
    } catch (error) {
        console.error('운송장 생성 실패:', error);
        alert('운송장 생성에 실패했습니다.');
    }
}

// 배송 로그 수동 생성 처리
async function handleManualLogGeneration(trackingNumber) {
    showModalLoading(modalContent, '배송 상태를 업데이트하고 있습니다...');
    try {
        const response = await fetch(`/api/v1/trackings/${trackingNumber}/generate-log`, { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await showTrackingDetail(trackingNumber); // 상세 정보 다시 로드
    } catch (error) {
        console.error('로그 생성 실패:', error);
        showModalError(modalContent, '상태 업데이트에 실패했습니다.');
    }
}

// 삭제 버튼 클릭 처리
function handleDeleteClick(trackingNumber) {
    currentDeleteTrackingNumber = trackingNumber;
    deleteTrackingNumberText.textContent = trackingNumber;
    deleteConfirmInput.value = '';
    confirmDeleteBtn.disabled = true;
    toggleModal('deleteModal', true);
}

// 최종 삭제 처리
async function handleConfirmDelete() {
    if (deleteConfirmInput.value !== currentDeleteTrackingNumber) {
        alert('운송장 번호가 일치하지 않습니다.');
        return;
    }
    try {
        const response = await fetch(`/api/v1/trackings/${currentDeleteTrackingNumber}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        toggleModal('deleteModal', false);
        await loadRecentTrackings(currentPage); // 현재 페이지 갱신
    } catch (error) {
        console.error('운송장 삭제 실패:', error);
        alert('운송장 삭제에 실패했습니다.');
    }
}

// 유틸리티 함수
function getStatusDotClass(status) { if (status === 'DELIVERED') return 'status-delivered'; if (['AT_SORT_HUB', 'DEPARTED_HUB', 'OUT_FOR_DELIVERY'].includes(status)) return 'status-in-transit'; return 'status-received'; }
function getTimelineDotClass(status, isCurrent) { if (isCurrent) return 'in-progress'; if (status === 'DELIVERED') return 'completed'; return 'pending'; }
function getStatusIcon(status) { switch (status) { case 'PICKED_UP': return 'inventory_2'; case 'AT_SORT_HUB': return 'maps_home_work'; case 'DEPARTED_HUB': return 'local_shipping'; case 'OUT_FOR_DELIVERY': return 'directions_bike'; case 'DELIVERED': return 'check_circle'; default: return 'info'; } }
function formatDateTime(dateString) { if (!dateString) return ''; return new Date(dateString).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }); }
function toggleModal(modalId, show) { const modalEl = document.getElementById(modalId); modalEl.classList.toggle('hidden', !show); document.body.style.overflow = show ? 'hidden' : ''; }
function showTableLoading(isLoading) { tableLoadingSpinner.classList.toggle('hidden', !isLoading); }
function showModalLoading(container, message) { container.innerHTML = `<div class="mt-6 text-center py-8"><div class="loading-spinner mx-auto mb-4"></div><p>${message}</p></div>`; }
function showModalError(container, message) { container.innerHTML = `<div class="mt-6 text-center py-8"><span class="material-icons text-red-500 text-4xl mb-4">error</span><p>${message}</p></div>`; }