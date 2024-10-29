// OpenAI API anahtarını buraya yapıştır
const apiKey = '';  // Aldığın API anahtarını buraya yapıştır

// PDF dosyasından metin çekmek için PDF.js kullanıyoruz
async function extractTextFromPDF(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  let textContent = '';

  // Her sayfayı işleyip metni birleştiriyoruz
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const text = await page.getTextContent();
    text.items.forEach(function (item) {
      textContent += item.str + ' ';
    });
  }

  return textContent;
}

// Sayfadaki PDF dosyasını bulup metni çekiyoruz
const pdfUrl = document.querySelector('embed, object').src;
if (pdfUrl) {
  extractTextFromPDF(pdfUrl).then(text => {
    // Soru işareti ile biten metinleri buluyoruz
    const sorular = text.match(/[^.?!]*\?/g);

    if (sorular && sorular.length > 0) {
      console.log('Bulunan sorular:', sorular);

      // Her soruyu OpenAI API'ye gönderip cevap alalım
      sorular.forEach(async (soru) => {
        const cevap = await getAnswerFromChatGPT(soru);
        showAnswerOnPage(soru, cevap);
      });
    } else {
      console.log("Sayfada soru bulunamadı.");
    }
  });
} else {
  console.log("PDF bulunamadı.");
}

// OpenAI API'ye soruyu gönderip cevabı alıyoruz
async function getAnswerFromChatGPT(soru) {
  const apiUrl = 'https://api.openai.com/v1/completions';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`  // API anahtarını kullanıyoruz
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',  // ChatGPT modelini kullanıyoruz
        prompt: soru,  // Soruyu API'ye gönderiyoruz
        max_tokens: 100  // Cevap uzunluğunu sınırlıyoruz
      })
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].text.trim();  // İlk cevabı alıyoruz
  } catch (error) {
    console.error('Cevap alınırken hata oluştu:', error);
    return 'Cevap alınırken hata oluştu. Lütfen daha sonra tekrar deneyin.';  // Kullanıcıya hata mesajı gösteriyoruz
  }
}

// Cevabı sayfada gösteriyoruz
function showAnswerOnPage(soru, cevap) {
  const resultDiv = document.createElement('div');
  resultDiv.style.position = 'fixed';
  resultDiv.style.bottom = '10px';
  resultDiv.style.right = '10px';
  resultDiv.style.backgroundColor = '#f9f9f9';
  resultDiv.style.border = '1px solid #333';
  resultDiv.style.padding = '15px';
  resultDiv.style.borderRadius = '5px';
  resultDiv.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.1)';
  resultDiv.style.zIndex = '1000';
  resultDiv.style.fontFamily = 'Arial, sans-serif';
  resultDiv.style.maxWidth = '300px';

  resultDiv.innerHTML = `
    <b style="font-size: 14px;">Soru:</b> ${soru}<br><br>
    <b style="font-size: 14px;">Cevap:</b> ${cevap}<br><br>
  `;

  document.body.appendChild(resultDiv);

  // 10 saniye sonra sonuç kutusunu otomatik olarak kaldır
  setTimeout(() => {
    if (document.body.contains(resultDiv)) {
      document.body.removeChild(resultDiv);
    }
  }, 10000);  // 10 saniye görünür olacak
}
