// Dashboard JavaScript Code
// GIST: Global Variables - ตัวแปรสำคัญ/อ้างอิงทั้งระบบ
let buildingData = [];
let filteredData = [];
let map, markersLayer;
let charts = {};
let currentPage = 1;
let rowsPerPage = 10;
let searchTerm = '';
let sortColumn = null;
let sortDirection = 'asc';

// GIST: ชุดคำอธิบายประเภทของอาคาร สำหรับแสดงใน tooltip
const buildingTypeDescriptions = {
    'A': 'บ้านพักอาศัย',
    'B': 'อาคารชุด (อาคารอยู่อาศัย)',
    'C': 'หอพัก (อาคารอยู่อาศัย)',
    'D': 'โรงแรม (อาคารพาณิชย์)',
    'E': 'สถานบริการประเภทสถานอาบน้ำ นวดหรืออบตัว (อาคารพาณิชย์)',
    'F': 'โรงเรียนเอกชน โรงเรียนของทางราชการ สถาบันอุดมศึกษาของเอกชนและสถาบันอุดมศึกษาของทางราชการ (อาคารพาณิชย์)',
    'G': 'อาคารที่ทำการของทางราชการ รัฐวิสาหกิจ หรือองค์การระหว่างประเทศและของเอกชน (อาคารพาณิชย์)',
    'H': 'ศูนย์การค้าหรือห้างสรรพสินค้า (อาคารพาณิชย์)',
    'I': 'ตลาด (อาคารพาณิชย์)',
    'J': 'ภัตตาคารหรือร้านอาหาร (อาคารพาณิชย์)',
    'K': 'สถานพยาบาลประเภทที่รับผู้ป่วยไว้ค้างคืน (อาคารสถานพยาบาล)',
    'L': 'อาคารประเภทอื่น ๆ'

};

// GIST: Event Listener - ทำงานเมื่อโหลดหน้าเว็บเสร็จสิ้น
document.addEventListener('DOMContentLoaded', function() {
    // Load data from GeoJSON
    buildingData = json_ds_building_envsurvey.features.map(f => f.properties);
    filteredData = [...buildingData];

    // Initialize map - สร้างแผนที่
    initializeMap();

    // Populate filters - เติมตัวเลือกในฟิลเตอร์ (Filters)
    populateFilters();

    // Update dashboard - อัปเดตแดชบอร์ด
    updateSummaryCards();
    updateCharts();
    updateDataTable();
    updateMapMarkers();

    // Event listeners - ตัวฟังเหตุการณ์สำคัญสำหรับฟิลเตอร์และตารางข้อมูล
    document.getElementById('filterRoad').addEventListener('change', applyFilters);
    document.getElementById('filterSoi').addEventListener('change', applyFilters);
    document.getElementById('filterType').addEventListener('change', applyFilters);
    document.getElementById('filterGT').addEventListener('change', applyFilters);
    document.getElementById('filterTRT').addEventListener('change', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Add Select All button listeners - เพิ่มตัวฟังเหตุการณ์สำหรับปุ่มเลือกทั้งหมด
    document.querySelectorAll('button.select-all').forEach(btn => {
        btn.addEventListener('click', selectAllOptions);
    });
    
    // Table controls event listeners - ตัวฟังเหตุการณ์สำหรับการควบคุมตารางข้อมูล
    document.getElementById('tableSearch').addEventListener('keyup', searchTable);
    document.getElementById('rowsPerPage').addEventListener('change', changeRowsPerPage);
    document.getElementById('prevPage').addEventListener('click', previousPage);
    document.getElementById('nextPage').addEventListener('click', nextPage);
    document.getElementById('pageJumpBtn').addEventListener('click', jumpToPage);
    document.getElementById('pageJumpInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') jumpToPage();
    });

    // Add table header sort listeners - เพิ่มตัวฟังเหตุการณ์สำหรับการเรียงลำดับคอลัมน์ตาราง
    document.querySelectorAll('table th.sortable').forEach(th => {
        th.addEventListener('click', function() {
            handleTableSort(this);
        });
    });
});

// GIST: Functions - ฟังก์ชันต่าง ๆ ที่ใช้ในแดชบอร์ด
function initializeMap() { // สร้างแผนที่
    map = L.map('map').setView([7.911, 98.295], 14);
    
    // Define basemap layers - กำหนดชั้นแผนที่ฐาน
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        name: 'OpenStreetMap Standard'
    });

    const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, © HOT',
        maxZoom: 19,
        name: 'OpenStreetMap HOT'
    });

    const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google Earth',
        maxZoom: 20,
        name: 'Google Satellite'
    });

    // Add default basemap - เพิ่มแผนที่ฐานเริ่มต้น
    osmStandard.addTo(map);

    // Create basemap layer control - สร้างตัวควบคุมการสลับแผนที่ฐาน
    const baseMaps = {
        'OpenStreetMap มาตรฐาน': osmStandard,
        'OpenStreetMap (HOT)': osmHOT,
        'ภาพถ่ายดาวเทียม Google': googleSatellite

    };

    // Add layer control to map - เพิ่มตัวควบคุมชั้นแผนที่ลงในแผนที่ (ปรับเปลี่ยนตำแหน่ง - position)
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // Initialize markers layer - สร้างชั้นเครื่องหมาย (Markers)
    markersLayer = L.featureGroup().addTo(map);
}

// GIST: Populate filter options - เติมตัวเลือกในฟิลเตอร์ (Filters)
function populateFilters() {
    // Get unique sorted values for each filter - ดึงค่าที่ไม่ซ้ำและเรียงลำดับสำหรับแต่ละฟิลเตอร์
    const roads = [...new Set(buildingData.map(b => b.bld_road).filter(Boolean))].sort();
    const sois = [...new Set(buildingData.map(b => b.bld_soi).filter(Boolean))].sort();
    const types = [...new Set(buildingData.map(b => b.bld_type).filter(Boolean))].sort();
    const gtOptions = [...new Set(buildingData.map(b => b.gt_inst).filter(Boolean))].sort();
    const trtOptions = [...new Set(buildingData.map(b => b.trt_inst).filter(Boolean))].sort();

    // Populate select elements - เติมตัวเลือกในองค์ประกอบ select
    roads.forEach(road => {
        const option = document.createElement('option');
        option.value = road;
        option.textContent = road;
        document.getElementById('filterRoad').appendChild(option);
    });

    // Populate soi filter options - เติมตัวเลือกในฟิลเตอร์ซอย
    sois.forEach(soi => {
        const option = document.createElement('option');
        option.value = soi;
        option.textContent = soi;
        document.getElementById('filterSoi').appendChild(option);
    });

    // Populate type filter options - เติมตัวเลือกในฟิลเตอร์ประเภทอาคาร
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.length > 60 ? type.substring(0, 60) + '...' : type;
        document.getElementById('filterType').appendChild(option);
    });

    // Populate GT and TRT filter options - เติมตัวเลือกในฟิลเตอร์ GT และ TRT
    gtOptions.forEach(gt => {
        const option = document.createElement('option');
        option.value = gt;
        option.textContent = gt;
        document.getElementById('filterGT').appendChild(option);
    });

    trtOptions.forEach(trt => {
        const option = document.createElement('option');
        option.value = trt;
        option.textContent = trt;
        document.getElementById('filterTRT').appendChild(option);
    });
}

// GIST: Select filters - เลือกตัวกรอง (Filters)
function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    return Array.from(select.selectedOptions).map(option => option.value);
}

// GIST: Apply filters - ใช้ตัวกรอง (Filters)
function applyFilters() {
    // Get selected filter values - ดึงค่าที่เลือกจากฟิลเตอร์
    const roads = getSelectedValues('filterRoad');
    const sois = getSelectedValues('filterSoi');
    const types = getSelectedValues('filterType');
    const gts = getSelectedValues('filterGT');
    const trts = getSelectedValues('filterTRT');

    // Filter data based on selections - กรองข้อมูลตามการเลือก
    filteredData = buildingData.filter(building => {
        return (roads.length === 0 || roads.includes(building.bld_road)) &&
               (sois.length === 0 || sois.includes(building.bld_soi)) &&
               (types.length === 0 || types.includes(building.bld_type)) &&
               (gts.length === 0 || gts.includes(building.gt_inst)) &&
               (trts.length === 0 || trts.includes(building.trt_inst));
    });

    // Update dashboard components - อัปเดตส่วนประกอบของแดชบอร์ด (สำคัญ - เลือกส่วนที่ต้องอัปเดต)
    updateSummaryCards();
    updateCharts();
    updateDataTable();
    updateMapMarkers();
}

// GIST: Reset filters - รีเซ็ตตัวกรอง (Filters)
function resetFilters() {
    document.getElementById('filterRoad').value = '';
    document.getElementById('filterSoi').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterGT').value = '';
    document.getElementById('filterTRT').value = '';
    
    // Clear all selections in multi-selects - ล้างการเลือกทั้งหมดในตัวเลือกหลายค่า
    document.querySelectorAll('select[multiple]').forEach(select => {
        Array.from(select.options).forEach(option => option.selected = false);
    });
    
    filteredData = [...buildingData]; // Reset filtered data to all data - รีเซ็ตข้อมูลที่กรองเป็นข้อมูลทั้งหมด
    // Update dashboard components - อัปเดตส่วนประกอบของแดชบอร์ด (หากตัวกรองถูกรีเซ็ต)
    updateSummaryCards();
    updateCharts();
    updateDataTable();
    updateMapMarkers();
}

// GIST: Select all options in a multi-select - เลือกตัวเลือกทั้งหมดในตัวเลือกหลายค่า
function selectAllOptions(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('data-target');
    const select = document.getElementById(targetId);
    Array.from(select.options).forEach(option => option.selected = true);
    applyFilters();
}

// GIST: Update dashboard components - อัปเดตส่วนประกอบของแดชบอร์ด
function updateSummaryCards() {
    const total = filteredData.length;
    const gtCount = filteredData.filter(b => b.gt_inst === 'มี').length;
    const trtCount = filteredData.filter(b => b.trt_inst === 'มี').length;

    document.getElementById('totalBuildings').textContent = total.toLocaleString();
    document.getElementById('gtInstCount').textContent = gtCount.toLocaleString();
    document.getElementById('trtInstCount').textContent = trtCount.toLocaleString();

    document.getElementById('gtInstPercent').textContent = total > 0 ? ((gtCount / total) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('trtInstPercent').textContent = total > 0 ? ((trtCount / total) * 100).toFixed(1) + '%' : '0%';
}

// GIST: Update charts - อัปเดตกราฟ
function updateCharts() {
    updateRoadChart();
    updateSoiChart();
    updateTypeChart();
}

// GIST: Individual chart update functions - ฟังก์ชันอัปเดตกราฟแต่ละประเภท
function updateRoadChart() {
    const roadCounts = {};
    filteredData.forEach(b => {
        if (b.bld_road) {
            roadCounts[b.bld_road] = (roadCounts[b.bld_road] || 0) + 1;
        }
    });

    const ctx = document.getElementById('roadChart').getContext('2d');
    
    if (charts.road) charts.road.destroy();
    // Create doughnut chart for road distribution - สร้างกราฟโดนัทสำหรับการกระจายตามข้อมูลชื่อถนน
    charts.road = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(roadCounts),
            datasets: [{
                data: Object.values(roadCounts),
                backgroundColor: ['#1e88e5', '#0d47a1', '#00a86b', '#ff6f00'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: { // Chart options - ตัวเลือกกราฟ
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                }
            }
        }
    });
}

function updateSoiChart() {
    const soiCounts = {};
    filteredData.forEach(b => {
        if (b.bld_soi) {
            soiCounts[b.bld_soi] = (soiCounts[b.bld_soi] || 0) + 1;
        }
    });

    // Separate dash from other labels and sort
    const dashEntry = soiCounts['-'] ? { label: '-', count: soiCounts['-'] } : null;
    const otherEntries = Object.entries(soiCounts)
        .filter(([label]) => label !== '-')
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 10)
        .map(([label, count]) => ({ label, count }));
    
    // Combine: sorted entries first, then dash at bottom
    const sortedEntries = dashEntry ? [...otherEntries, dashEntry] : otherEntries;
    const labels = sortedEntries.map(e => e.label);
    const data = sortedEntries.map(e => e.count);

    const ctx = document.getElementById('soiChart').getContext('2d');
    
    if (charts.soi) charts.soi.destroy();
    
    // Create horizontal bar chart for soi distribution - สร้างกราฟแท่งแนวนอนสำหรับการกระจายตามข้อมูลชื่อซอย
    charts.soi = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Buildings',
                data: data,
                backgroundColor: '#1e88e5',
                borderColor: '#1e88e5',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function updateTypeChart() {
    const typeCounts = {};
    filteredData.forEach(b => {
        if (b.bld_type) {
            typeCounts[b.bld_type] = (typeCounts[b.bld_type] || 0) + 1;
        }
    });

    // Sort labels alphabetically and create sorted arrays
    const sortedLabels = Object.keys(typeCounts).sort((a, b) => a.localeCompare(b));
    const sortedData = sortedLabels.map(label => typeCounts[label]);

    const ctx = document.getElementById('typeChart').getContext('2d');
    
    if (charts.type) charts.type.destroy();
    
    // Create pie chart for building type distribution - สร้างกราฟวงกลมสำหรับการกระจายตามประเภทอาคาร
    charts.type = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Number of Buildings',
                data: sortedData,
                backgroundColor: [
                    '#1e88e5',
                    '#0d47a1',
                    '#00a86b',
                    '#ff6f00',
                    '#0097a7',
                    '#4db8a8',
                    '#ff5722',
                    '#ffd600'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// GIST: Update map markers - อัปเดตเครื่องหมาย/สัญลักษณ์บนแผนที่
function updateMapMarkers() {
    markersLayer.clearLayers();

    const coordinates = json_ds_building_envsurvey.features.map(f => ({
        props: f.properties,
        coord: f.geometry.coordinates
    }));

    filteredData.forEach(building => {
        const feature = coordinates.find(c => c.props.bld_hno === building.bld_hno && c.props.bld_road === building.bld_road);
        // Ensure feature and coordinates exist - ตรวจสอบให้แน่ใจว่ามีฟีเจอร์และค่าพิกัด (หากข้อมูลไม่สมบูรณ์ จะไม่แสดงเครื่องหมาย)
        if (feature) {
            const [lon, lat] = feature.coord;
            const marker = L.circleMarker([lat, lon], {
                radius: 6,
                fillColor: building.gt_inst === 'มี' ? '#48bb78' : building.gt_inst === 'ไม่มี' ? '#ef5350' : '#9e9e9e',
                color: '#fff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.7
            });
            
            // Create popup content - สร้างเนื้อหาของป๊อปอัพ
            // GIST: Use template literals for better readability - ใช้เทมเพลตลิเทอรัลเพื่อความอ่านง่ายขึ้น
            const popupContent = `
                <div class="popup-title">
                ${building.bld_name && building.bld_name !== '-' 
                    ? building.bld_name 
                    : '(ไม่มีชื่อ)'}
                ${building.bld_hno && building.bld_hno !== '-' 
                    ? ' เลขที่: ' + building.bld_hno 
                    : ' ไม่ทราบเลขที่'}
                </div>
                <div class="popup-row">
                    <span class="popup-label">ถนน:</span>
                    <span>${building.bld_road}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-label">ซอย:</span>
                    <span>${building.bld_soi}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-label">ประเภทของอาคาร:</span>
                    <span>${building.bld_type}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-label">การติดตั้งถังดักไขมัน (GT):</span>
                    <span>${building.gt_inst}</span>
                </div>
                <div class="popup-row">
                    <span class="popup-label">การติดตั้งระบบบำบัดน้ำเสีย (TRT):</span>
                    <span>${building.trt_inst}</span>
                </div>
            `;
            
            // Bind popup to marker - ผูกป๊อปอัพกับเครื่องหมาย
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        }
    });
}

// GIST: Data table functions - ฟังก์ชันสำหรับตารางข้อมูล
function updateDataTable() {
    currentPage = 1;
    renderTable();
}

// GIST: Table sorting function - ฟังก์ชันการเรียงลำดับตาราง
function handleTableSort(headerElement) {
    const column = headerElement.getAttribute('data-sort');
    
    // Toggle sort direction if clicking the same column - สลับทิศทางการเรียงลำดับหากคลิกที่คอลัมน์เดียวกัน
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Update visual indicators - อัปเดตตัวบ่งชี้ภาพ
    document.querySelectorAll('table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    headerElement.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    
    currentPage = 1;
    renderTable(); // Re-render table with new sorting - เรนเดอร์ตารางใหม่ด้วยการเรียงลำดับใหม่
}

// GIST: Render table function - ฟังก์ชันการเรนเดอร์ข้อมูลตาราง
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    // Filter data based on search term - กรองข้อมูลตามคำค้นหา
    let displayData = [...filteredData];
    if (searchTerm) {
        displayData = displayData.filter(building => {
            const name = (building.bld_name || '').toLowerCase();
            const houseNo = (building.bld_hno || '').toLowerCase();
            return name.includes(searchTerm) || houseNo.includes(searchTerm);
        });
    }

    // Apply sorting - ใช้การเรียงลำดับ
    if (sortColumn) {
        displayData.sort((a, b) => {
            let aVal = a[sortColumn] || '';
            let bVal = b[sortColumn] || '';
            
            // Handle numeric sorting for dates and house numbers
            if (sortColumn === 'rec_date' || sortColumn === 'bld_hno') {
                aVal = String(aVal).trim();
                bVal = String(bVal).trim();
                // Try numeric comparison first
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
                }
            }
            
            // String comparison - การเปรียบเทียบข้อความ
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            const comparison = aVal.localeCompare(bVal);
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    const totalRows = displayData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;

    // Ensure current page is valid - ตรวจสอบให้แน่ใจว่าหน้าปัจจุบันถูกต้อง
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    const pageData = displayData.slice(startIdx, endIdx);

    pageData.forEach(building => { // Create table row for each building - สร้างแถวตารางสำหรับแต่ละอาคาร
        const row = document.createElement('tr');
        
        // Determine badge classes based on installation status - กำหนดคลาสของป้ายตามสถานะการติดตั้ง
        const gtBadge = building.gt_inst === 'มี' ? 'yes' : building.gt_inst === 'ไม่มี' ? 'no' : 'unknown';
        const trtBadge = building.trt_inst === 'มี' ? 'yes' : building.trt_inst === 'ไม่มี' ? 'no' : 'unknown';
        
        // Get short type and full description for tooltip - ดึงประเภทสั้นและคำอธิบายเต็มสำหรับ tooltip
        const shortType = building.bld_type.split(':')[0];
        const fullTypeDescription = buildingTypeDescriptions[shortType] || shortType;
        
        // Use template literals for better readability - ใช้เทมเพลตลิเทอรัลเพื่อความอ่านง่ายขึ้น
        // ข้อมูลบางส่วนอาจไม่มีค่า (null/undefined) จึงใช้ || '-' เพื่อแสดงเครื่องหมายขีดกลางแทน
        row.innerHTML = `
            <td>${building.bld_hno}</td>    
            <td>${building.bld_name && building.bld_name !== '-' ? building.bld_name : '-'}</td>
            <td>${building.bld_road}</td>
            <td>${building.bld_soi}</td>
            <td>
                <span class="badge category tooltip-container">
                    ${shortType}
                    <span class="tooltip-text">${fullTypeDescription}</span>
                </span>
            </td>
            <td><span class="badge ${gtBadge}">${building.gt_inst}</span></td>
            <td><span class="badge ${trtBadge}">${building.trt_inst}</span></td>
            <td>${building.rec_date}</td>
        `; // ตรวจสอบลำดับคอลัมน์ให้ตรงกับหัวตาราง (th) ใน HTML
        
        tbody.appendChild(row); // Append row to table body - เพิ่มแถวลงในส่วนของตาราง (tbody)
    });

    // Update pagination info - อัปเดตข้อมูลการแบ่งหน้า
    document.getElementById('rowStart').textContent = totalRows > 0 ? startIdx + 1 : 0;
    document.getElementById('rowEnd').textContent = endIdx;
    document.getElementById('totalRows').textContent = totalRows;
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;

    // Update button states - อัปเดตสถานะของปุ่มกด สำหรับการแบ่งหน้า
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// GIST: Table control functions - ฟังก์ชันควบคุมตารางข้อมูล
function searchTable() {
    searchTerm = document.getElementById('tableSearch').value.toLowerCase();
    currentPage = 1;
    renderTable();
}

// GIST: Change rows per page - เปลี่ยนจำนวนแถวต่อหน้า
function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    currentPage = 1;
    renderTable();
}

// GIST: Pagination functions - ฟังก์ชันการแบ่งหน้า
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

// GIST: Next page function - ฟังก์ชันหน้าถัดไป
function nextPage() {
    const totalRows = searchTerm 
        ? filteredData.filter(b => (b.bld_name || '').toLowerCase().includes(searchTerm) || (b.bld_hno || '').toLowerCase().includes(searchTerm)).length
        : filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// GIST: Jump to specific page function - ฟังก์ชันกระโดดไปยังหน้าที่ระบุ
function jumpToPage() {
    const pageInput = document.getElementById('pageJumpInput');
    const pageNumber = parseInt(pageInput.value);
    
    const totalRows = searchTerm 
        ? filteredData.filter(b => (b.bld_name || '').toLowerCase().includes(searchTerm) || (b.bld_hno || '').toLowerCase().includes(searchTerm)).length
        : filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        currentPage = pageNumber;
        renderTable();
        pageInput.value = '';
    } else {
        alert(`กรุณากรอกหมายเลขหน้าระหว่าง 1 ถึง ${totalPages}`);
        pageInput.value = '';
    }
}

// GIST: หมายเหตุ - คำอธิบายเพิ่มเติม
// - โค้ดนี้เป็นส่วนหนึ่งของแดชบอร์ดที่ใช้แสดงข้อมูลอาคารจากชุดข้อมูล GeoJSON
// - มีการใช้งานไลบรารี Leaflet สำหรับแผนที่ และ Chart.js สำหรับกราฟ
// - ฟังก์ชันต่าง ๆ ถูกจัดกลุ่มตามหน้าที่เพื่อความสะดวกในการดูแลรักษาและขยายโค้ดในอนาคต
// - คำอธิบายในโค้ดใช้ภาษาไทยเพื่อความเข้าใจที่ดีขึ้นสำหรับผู้พัฒนาในบริบทนี้
// - โปรดตรวจสอบให้แน่ใจว่าได้รวมไลบรารีที่จำเป็นใน HTML เช่น Leaflet, Chart.js และไฟล์ CSS ที่เกี่ยวข้อง
// - หากมีการเปลี่ยนแปลงโครงสร้างข้อมูล GeoJSON อาจต้องปรับปรุงโค้ดให้สอดคล้องกัน

// GIST: End of file - สิ้นสุดไฟล์ rev02/resources/dashboard.js