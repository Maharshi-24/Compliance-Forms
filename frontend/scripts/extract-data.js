document.getElementById('extractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formName = document.getElementById('formSelect').value;
    const messageDiv = document.getElementById('message');
    const downloadLinksDiv = document.getElementById('downloadLinks');
    messageDiv.textContent = 'Extracting data...';
    messageDiv.className = ''; // Reset classes
    downloadLinksDiv.innerHTML = '';

    try {
        const response = await fetch(`/api/extract-data?formName=${formName}`, {
            headers: {
                'User-ID': localStorage.getItem('userId')
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        // Prepare data for Excel, excluding file content
        const excelData = data.map(item => {
            const { file_content, ...rest } = item;
            return rest;
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formName}_data.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        messageDiv.textContent = 'Data extracted and downloaded successfully!';
        messageDiv.classList.add('success'); // Add success class
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'An error occurred while extracting data.';
        messageDiv.classList.add('error'); // Add error class
    }
});