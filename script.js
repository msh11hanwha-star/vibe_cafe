// ===================================================
// 바이브 카페 (숭실대 카페) 주문 페이지 자바스크립트
// - 초보자를 위한 상세 주석 포함
// ===================================================

// [Supabase 설정]
// 발급받으신 Supabase Project URL과 Anon Public Key
const SUPABASE_URL = 'https://kcepvrydyksjpqgukgvj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZXB2cnlkeWtzanBxZ3VrZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzIxNzMsImV4cCI6MjEwNjgwODE3M30.wb2T1edWYy1xDHUknmjWbSYPNgCAzEA7rx8SnKlfSNA';

// Supabase 클라이언트 초기화 (supabaseClient)
const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient) 
    ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
    : null;

// [음료별 고화질 대표 이미지 매핑]
const DRINK_IMAGES = {
    'americano': {
        name: '숭실대 아메리카노',
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85'
    },
    'latte': {
        name: '숭실대 카페라떼',
        url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=1000&q=85'
    },
    'mocha': {
        name: '숭실대 카페모카',
        url: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=1000&q=85'
    },
    'vanilla-latte': {
        name: '숭실대 바닐라라떼',
        url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1000&q=85'
    },
    'green-tea-latte': {
        name: '숭실대 녹차라떼',
        url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1000&q=85'
    }
};

// 1. 주문 데이터 관리 변수 (로컬 화면용)
let orders = []; // 접수된 주문 객체들을 보관하는 배열
let orderIdCounter = 1; // 주문마다 부여할 고유 주문번호 (1부터 증가)

// 2. HTML DOM 요소 선택
// [탭 관련 요소]
const tabOrderBtn = document.getElementById('tabOrderBtn');
const tabHistoryBtn = document.getElementById('tabHistoryBtn');
const orderTabContent = document.getElementById('orderTabContent');
const historyTabContent = document.getElementById('historyTabContent');
const orderCountBadge = document.getElementById('orderCountBadge');

// [주문서 폼 요소]
const orderForm = document.getElementById('orderForm');
const userNameInput = document.getElementById('userName');
const userPhoneInput = document.getElementById('userPhone');
const drinkSelect = document.getElementById('drinkSelect');
const quantityInput = document.getElementById('quantity');
const userRequestsInput = document.getElementById('userRequests');
const totalPriceSpan = document.getElementById('totalPrice');
const submitBtn = document.getElementById('submitBtn'); // 주문하기 버튼
const resetBtn = document.getElementById('resetBtn'); // 다시 작성 버튼
const orderConfirmation = document.getElementById('orderConfirmation'); // 주문 확인 메시지 영역

// [음료 이미지 미리보기 요소]
const drinkImageContainer = document.getElementById('drinkImageContainer');
const drinkImage = document.getElementById('drinkImage');
const drinkImageCaption = document.getElementById('drinkImageCaption');

// [주문 내역 탭 요소]
const ordersList = document.getElementById('ordersList');
const emptyOrdersMessage = document.getElementById('emptyOrdersMessage');
const historyFooter = document.getElementById('historyFooter');
const totalOrdersSummary = document.getElementById('totalOrdersSummary');
const clearOrdersBtn = document.getElementById('clearOrdersBtn');

/**
 * 3. 탭 전환 기능
 * - 클릭한 탭을 활성화하고 해당하는 컨텐츠 영역의 hidden 클래스를 제어합니다.
 */
function switchTab(tabName) {
    if (tabName === 'order') {
        // 주문하기 탭 활성화
        tabOrderBtn.classList.add('active');
        tabHistoryBtn.classList.remove('active');
        orderTabContent.classList.remove('hidden');
        historyTabContent.classList.add('hidden');
    } else if (tabName === 'history') {
        // 주문 내역 탭 활성화
        tabHistoryBtn.classList.add('active');
        tabOrderBtn.classList.remove('active');
        historyTabContent.classList.remove('hidden');
        orderTabContent.classList.add('hidden');
    }
}

tabOrderBtn.addEventListener('click', () => switchTab('order'));
tabHistoryBtn.addEventListener('click', () => switchTab('history'));

/**
 * 4. 선택된 음료의 고화질 이미지를 갱신하는 함수
 */
function updateDrinkImage() {
    const selectedValue = drinkSelect.value;
    const item = DRINK_IMAGES[selectedValue];

    if (item) {
        drinkImage.src = item.url;
        drinkImage.alt = item.name;
        drinkImageCaption.textContent = item.name;
        drinkImageContainer.classList.remove('hidden');
    } else {
        drinkImageContainer.classList.add('hidden');
        drinkImage.src = '';
        drinkImageCaption.textContent = '';
    }
}

/**
 * 5. 예상 금액을 계산하는 함수 (calculateTotal)
 * - 음료, 사이즈, 추가 옵션, 수량을 바탕으로 총 금액을 계산하고 화면에 표시합니다.
 * - @returns {number} 계산된 최종 금액
 */
function calculateTotal() {
    // 5-1. 선택된 음료 이미지 갱신
    updateDrinkImage();

    // 5-2. 선택된 음료 가격 확인
    const selectedDrinkOption = drinkSelect.options[drinkSelect.selectedIndex];
    if (!selectedDrinkOption) {
        totalPriceSpan.textContent = '0원';
        return 0;
    }
    const drinkPrice = Number(selectedDrinkOption.dataset.price) || 0;

    // 음료를 선택하지 않은 상태라면 예상 금액을 0원으로 표시
    if (drinkSelect.value === '' || drinkPrice === 0) {
        totalPriceSpan.textContent = '0원';
        return 0;
    }

    // 5-3. 선택된 사이즈 가격 확인 (라디오 버튼)
    const selectedSizeRadio = document.querySelector('input[name="drinkSize"]:checked');
    const sizePrice = selectedSizeRadio ? (Number(selectedSizeRadio.dataset.price) || 0) : 0;

    // 5-4. 체크된 추가 옵션들의 가격 합산
    const checkedOptionBoxes = document.querySelectorAll('input[name="options"]:checked');
    let optionsPrice = 0;
    checkedOptionBoxes.forEach((checkbox) => {
        optionsPrice += Number(checkbox.dataset.price) || 0;
    });

    // 5-5. 수량 확인
    let quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
    }

    // 5-6. 1잔 가격 = 기본음료 + 사이즈추가 + 옵션추가
    const singleCupPrice = drinkPrice + sizePrice + optionsPrice;

    // 5-7. 총 금액 = 1잔 가격 * 수량
    const finalTotal = singleCupPrice * quantity;

    // 5-8. 천 단위 콤마(,) 표시 (예: 5000 -> 5,000원)
    totalPriceSpan.textContent = `${finalTotal.toLocaleString()}원`;

    return finalTotal;
}

// 주문서 입력값 변경 시 실시간 금액 계산 이벤트 연결
orderForm.addEventListener('change', calculateTotal);
orderForm.addEventListener('input', calculateTotal);

/**
 * 6. 주문 내역 목록을 화면에 그리는 함수 (renderOrders)
 * - orders 배열의 데이터를 바탕으로 주문 카드를 생성하고 요약을 갱신합니다.
 * - 보안을 위해 사용자 입력 텍스트는 innerHTML 대신 textContent로 안전하게 삽입합니다.
 */
function renderOrders() {
    // 6-1. 주문 건수 배지 갱신
    orderCountBadge.textContent = orders.length;

    // 6-2. 주문 내역이 없을 때의 처리
    if (orders.length === 0) {
        ordersList.innerHTML = ''; // 목록 비우기
        emptyOrdersMessage.classList.remove('hidden'); // '주문 내역 없음' 안내 표시
        historyFooter.classList.add('hidden'); // 하단 요약 및 삭제버튼 숨김
        return;
    }

    // 6-3. 주문 내역이 있을 때의 처리
    emptyOrdersMessage.classList.add('hidden');
    historyFooter.classList.remove('hidden');
    ordersList.innerHTML = ''; // 이전 목록 초기화 후 새로 그리기

    // 총 주문 금액 합산
    let totalRevenue = 0;

    // orders 배열을 순회하며 카드 생성 (최신 주문이 맨 앞에 들어있음)
    orders.forEach((order) => {
        totalRevenue += order.totalPrice;

        // [주문 카드 div]
        const card = document.createElement('div');
        card.className = 'order-card';

        // 1) 카드 상단 영역 (1줄 정보 + 취소 버튼)
        const cardTop = document.createElement('div');
        cardTop.className = 'order-card-top';

        // 1줄 텍스트: "#1 홍길동님 · 5,000원"
        const titleSpan = document.createElement('span');
        titleSpan.className = 'order-card-title';
        titleSpan.textContent = `#${order.id} ${order.userName}님 · ${order.totalPrice.toLocaleString()}원`;

        // 개별 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-cancel-order';
        cancelBtn.textContent = '취소';
        cancelBtn.addEventListener('click', () => {
            // 삭제 전 확인 창 띄우기
            if (confirm(`주문 #${order.id} (${order.userName}님) 내역을 취소하시겠습니까?`)) {
                // 해당 주문 ID를 제외하고 배열 필터링
                orders = orders.filter((item) => item.id !== order.id);
                renderOrders(); // 화면 다시 그리기
            }
        });

        cardTop.appendChild(titleSpan);
        cardTop.appendChild(cancelBtn);
        card.appendChild(cardTop);

        // 2) 2줄 텍스트: "숭실대 카페라떼 M사이즈 (샷 추가) 1잔"
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'order-card-details';
        detailsDiv.textContent = `${order.drinkName} ${order.size}사이즈${order.optionText} ${order.quantity}잔`;
        card.appendChild(detailsDiv);

        // 3) 3줄 텍스트: 요청사항(있을 때만) · 주문 시간
        const metaDiv = document.createElement('div');
        metaDiv.className = 'order-card-meta';
        if (order.userRequests) {
            metaDiv.textContent = `${order.userRequests} · ${order.orderTime}`;
        } else {
            metaDiv.textContent = order.orderTime;
        }
        card.appendChild(metaDiv);

        // 완성된 카드를 목록 컨테이너에 추가
        ordersList.appendChild(card);
    });

    // 6-4. 하단 요약 텍스트 갱신 (예: "총 주문 금액: 15,000원 (3건)")
    totalOrdersSummary.textContent = `총 주문 금액: ${totalRevenue.toLocaleString()}원 (${orders.length}건)`;
}

/**
 * 7. "내역 모두 지우기" 버튼 클릭 이벤트
 */
clearOrdersBtn.addEventListener('click', () => {
    if (orders.length === 0) return;
    if (confirm('모든 주문 내역을 삭제하시겠습니까?')) {
        orders = []; // 전체 배열 비우기
        renderOrders(); // 목록 다시 그리기
    }
});

/**
 * 8. 주문하기 버튼 클릭 시 Supabase DB(cafe_menu03)에 저장 및 화면 처리
 */
orderForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // 폼 기본 새로고침 방지

    // 8-1. 유효성 검사 (이름 & 음료)
    const userName = userNameInput.value.trim();
    if (userName === '') {
        alert('이름을 입력해주세요');
        userNameInput.focus();
        return;
    }

    if (drinkSelect.value === '') {
        alert('음료를 선택해주세요');
        drinkSelect.focus();
        return;
    }

    const userPhone = userPhoneInput.value.trim();

    // 8-2. 주문 데이터 가공
    // 음료 이름 및 기본 가격
    const selectedDrinkOption = drinkSelect.options[drinkSelect.selectedIndex];
    const rawDrinkText = selectedDrinkOption.textContent;
    const drinkName = rawDrinkText.split(' (')[0].trim();
    const drinkPrice = Number(selectedDrinkOption.dataset.price) || 0;

    // 사이즈 이름
    const selectedSizeRadio = document.querySelector('input[name="drinkSize"]:checked');
    const sizeName = selectedSizeRadio ? selectedSizeRadio.value : 'M';

    // 추가 옵션 목록 (배열 형태: ["샷 추가", "크림 추가"])
    const checkedOptionBoxes = document.querySelectorAll('input[name="options"]:checked');
    const optionNames = [];
    checkedOptionBoxes.forEach((checkbox) => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
            const cleanOptionName = label.textContent.split(' (')[0].trim();
            optionNames.push(cleanOptionName);
        }
    });

    // 화면 표시용 옵션 텍스트 (예: " (샷 추가, 크림 추가)")
    const optionText = optionNames.length > 0 ? ` (${optionNames.join(', ')})` : '';

    // 수량 및 요청사항
    const quantity = parseInt(quantityInput.value, 10) || 1;
    const userRequests = userRequestsInput.value.trim();

    // 총 금액 계산
    const total = calculateTotal();
    const formattedTotal = total.toLocaleString();

    // 8-3. 중복 클릭 방지 (저장 작업 중 주문하기 버튼 비활성화)
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '주문 처리 중...';

    try {
        // 8-4. Supabase DB의 cafe_menu03 테이블에 주문 저장
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('cafe_menu03')
                .insert([
                    {
                        customer_name: userName,
                        phone: userPhone,
                        drink: drinkName,
                        drink_price: drinkPrice,
                        size: sizeName,
                        options: optionNames, // PostgreSQL text[] 배열 형태로 저장
                        quantity: quantity,
                        request: userRequests,
                        total_price: total
                    }
                ]);

            // Supabase 저장 중 오류가 발생하면 catch로 전달
            if (error) {
                throw error;
            }
        } else {
            console.warn('ℹ️ SUPABASE_URL과 SUPABASE_KEY를 입력하시면 cafe_menu03 테이블에 자동 저장됩니다.');
        }

        // 8-5. 저장 성공 시 로컬 주문 내역에 추가
        const now = new Date();
        const orderTime = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const newOrder = {
            id: orderIdCounter++,
            userName: userName,
            drinkName: drinkName,
            size: sizeName,
            optionText: optionText,
            quantity: quantity,
            userRequests: userRequests,
            totalPrice: total,
            orderTime: orderTime
        };

        // 최신 주문을 배열 맨 앞에 추가 후 화면 갱신
        orders.unshift(newOrder);
        renderOrders();

        // 8-6. 저장 성공 시 기존 주문 완료 확인 메시지 표시
        const orderSummaryMessage = `${userName}님, ${drinkName} ${sizeName}사이즈${optionText} ${quantity}잔, 총 ${formattedTotal}원 주문이 접수되었습니다!`;
        orderConfirmation.textContent = orderSummaryMessage;
        orderConfirmation.classList.remove('hidden');

        // 완료 메시지로 화면 스크롤 이동
        orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        // 8-7. 저장 실패 시 알림창 및 콘솔에 에러 출력
        alert('주문 저장에 실패했어요');
        console.error('주문 저장 에러:', error);
    } finally {
        // 8-8. 작업 완료 후 주문하기 버튼 상태 복구
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

/**
 * 9. 다시 작성 버튼 클릭 (주문서 초기화)
 * - 주문서 입력 필드만 초기화하며, 이미 접수된 orders 내역은 유지됩니다.
 */
orderForm.addEventListener('reset', function () {
    setTimeout(() => {
        // M 사이즈 기본 선택
        const sizeMRadio = document.getElementById('sizeM');
        if (sizeMRadio) {
            sizeMRadio.checked = true;
        }

        // 수량 1로 복구
        quantityInput.value = '1';

        // 이미지 미리보기 숨기기
        updateDrinkImage();

        // 확인 메시지 숨기기
        orderConfirmation.classList.add('hidden');
        orderConfirmation.textContent = '';

        // 금액 0원으로 갱신
        calculateTotal();
    }, 0);
});

// 10. 페이지 초기 로드 시 실행
calculateTotal(); // 예상 금액 0원 및 초기 이미지 설정
renderOrders(); // 주문 내역 빈 상태 초기화 (배지 0건 및 안내 문구 표시)
