// /wipikit/submitHandler.js

// this file handles the form submission flow:
// 1. get presigned URL from the same endpoint
// 2. upload image to presigned URL
// 3. submit address + instruction + image key to same endpoint

document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submitModal');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async function() {
        const address = document.getElementById('address').value.trim();
        const instruction = document.getElementById('instruction').value.trim();
        const fileInput = document.getElementById('imageFile');
        const file = fileInput.files[0];

        if (!address || !instruction || !file) {
            alert('please fill all fields and select an image.');
            return;
        }

        // show submitting state
        submitBtn.textContent = 'sending...';
        submitBtn.disabled = true;

        try {
            const apiEndpoint = window.DRIFT_CONFIG.apiEndpoint;

            // 1. request presigned URL (POST to same endpoint with action=presign)
            const presignRes = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'presign',
                    filename: file.name,
                    fileType: file.type
                })
            });

            if (!presignRes.ok) throw new Error('failed to get upload url');
            const presignData = await presignRes.json();
            // expected response: { uploadUrl: '...', key: '...' }

            // 2. upload image directly to presigned URL (PUT)
            const uploadRes = await fetch(presignData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadRes.ok) throw new Error('image upload failed');

            // 3. submit the rest of the data (address, instruction, image key)
            const submitRes = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    address: address,
                    instruction: instruction,
                    imageKey: presignData.key
                })
            });

            if (!submitRes.ok) throw new Error('submission failed');

            alert('done! we’ll come by within a day.');
            // reset and close modal
            document.getElementById('address').value = '';
            document.getElementById('instruction').value = '';
            document.getElementById('imageFile').value = '';
            document.getElementById('modalOverlay').classList.remove('active');

        } catch (err) {
            alert('something went wrong: ' + err.message);
        } finally {
            submitBtn.textContent = 'submit';
            submitBtn.disabled = false;
        }
    });
});
