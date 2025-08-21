// Adzuna API test - gerçek veriyi görelim
const APP_ID = 'a19dd595';
const APP_KEY = '0f8160edaa39c3dcac3962d77b32236b';

async function testAdzunaAPI() {
    const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=1&what=developer&where=London&content-type=application/json`;
    
    console.log('Adzuna API test başlıyor...');
    console.log('URL:', url);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('\n=== TAM API YANITI ===');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.results && data.results[0]) {
            const job = data.results[0];
            console.log('\n=== İLK İŞ İLANI DETAYLARI ===');
            console.log('Mevcut Alanlar:');
            Object.keys(job).forEach(key => {
                console.log(`- ${key}:`, typeof job[key] === 'object' ? JSON.stringify(job[key]) : job[key]);
            });
            
            console.log('\n=== KULLANILABILIR VERİLER ===');
            console.log('ID:', job.id);
            console.log('Title:', job.title);
            console.log('Description:', job.description);
            console.log('Created:', job.created);
            console.log('Company:', job.company);
            console.log('Location:', job.location);
            console.log('Latitude:', job.latitude);
            console.log('Longitude:', job.longitude);
            console.log('Redirect URL:', job.redirect_url);
            console.log('Category:', job.category);
            console.log('Salary Min:', job.salary_min);
            console.log('Salary Max:', job.salary_max);
            console.log('Salary is predicted:', job.salary_is_predicted);
            console.log('Contract Type:', job.contract_type);
            console.log('Contract Time:', job.contract_time);
        }
        
    } catch (error) {
        console.error('Hata:', error);
    }
}

// Node.js'de çalıştırmak için:
// node test-adzuna-api.js

// Tarayıcıda test etmek için:
testAdzunaAPI();