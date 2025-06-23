/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY_MAIN_FORM = 'mainApplicationFormData';
const MAX_CHILDREN = 5;

let isLoadingData = false; // Flag to prevent saving while loading

// --- Helper Functions ---

function calculateAge(dobInput: HTMLInputElement | null, ageDisplay: HTMLSpanElement | null, ageInputHidden: HTMLInputElement | null) {
    if (dobInput && ageDisplay && ageInputHidden && dobInput.value) {
        const birthDate = new Date(dobInput.value);
        if (isNaN(birthDate.getTime())) {
            if (ageDisplay) ageDisplay.textContent = '';
            if (ageInputHidden) ageInputHidden.value = '';
            return;
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        const displayAge = age >= 0 ? age.toString() : '';
        ageDisplay.textContent = displayAge;
        ageInputHidden.value = displayAge;
    } else if (ageDisplay && ageInputHidden) {
        ageDisplay.textContent = '';
        ageInputHidden.value = '';
    }
}

function updateAddChildButtonState(childrenContainer: HTMLElement | null, addChildButton: HTMLElement | null) {
    if (!childrenContainer || !addChildButton) return;
    const currentChildrenCount = childrenContainer.querySelectorAll('.child-entry').length;
    if (currentChildrenCount >= MAX_CHILDREN) {
        addChildButton.classList.add('hidden');
    } else {
        addChildButton.classList.remove('hidden');
    }
}

function addChildEntry(
    childTemplate: HTMLTemplateElement | null, 
    childrenContainer: HTMLElement | null, 
    addChildButton: HTMLElement | null,
    childData?: { name: string, dob: string }
) {
    if (!childTemplate || !childrenContainer) return;

    const currentChildrenCount = childrenContainer.querySelectorAll('.child-entry').length;
    if (currentChildrenCount >= MAX_CHILDREN) {
        updateAddChildButtonState(childrenContainer, addChildButton);
        return null;
    }

    const templateContent = childTemplate.content.cloneNode(true) as DocumentFragment;
    const newEntry = templateContent.querySelector('.child-entry') as HTMLElement;
    
    const childNameInput = newEntry.querySelector<HTMLInputElement>('input[name="childName[]"]');
    const childDobInput = newEntry.querySelector<HTMLInputElement>('input[name="childDob[]"]');

    if (childData) {
        if (childNameInput) childNameInput.value = childData.name;
        if (childDobInput) {
            childDobInput.value = childData.dob;
        }
    }
    
    const removeButton = newEntry.querySelector('.removeChildButton');
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            newEntry.remove();
            updateAddChildButtonState(childrenContainer, addChildButton);
            saveMainFormData();
        });
    }
    
    childrenContainer.appendChild(newEntry);
    updateAddChildButtonState(childrenContainer, addChildButton);
    return newEntry;
}


// --- Data Persistence ---
function saveMainFormData() {
    if (isLoadingData) {
        console.log('Skipping saveMainFormData while data is loading.');
        return;
    }

    const applicationForm = document.getElementById('applicationForm') as HTMLFormElement | null;
    if (!applicationForm) return;

    const dataToStore: { [key: string]: any } = {};
    const formData = new FormData(applicationForm);

    formData.forEach((value, key) => {
        const element = applicationForm.elements.namedItem(key);
        if (element instanceof RadioNodeList) { 
            dataToStore[key] = value;
        } else if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            // This generic checkbox handling is tricky with FormData as it only includes checked ones.
            // Specific handlers (like for crewTypeValues) are more reliable for groups.
            // For single checkboxes, we need to query their state directly if we want to save 'false'.
            // However, the current crewType is handled explicitly later.
            // This section can be simplified if all checkboxes are handled explicitly or if FormData's behavior is accepted.
            if (dataToStore[key]) {
                if (!Array.isArray(dataToStore[key])) {
                    dataToStore[key] = [dataToStore[key]];
                }
                dataToStore[key].push(value);
            } else {
                 // Check if it's a single checkbox (not part of a NodeList of checkboxes with same name)
                const item = applicationForm.elements.namedItem(key);
                if (item instanceof HTMLInputElement && item.type === 'checkbox') { // Single checkbox
                    dataToStore[key] = item.checked;
                } else { // Part of a checkbox group
                    dataToStore[key] = [value];
                }
            }
        } else if (key.endsWith('[]')) { 
            // This is for childName[] and childDob[].
            // Note: `dataToStore.children` is the primary source for loading children. This is somewhat redundant.
            const cleanKey = key.slice(0, -2);
            if (!dataToStore[cleanKey]) {
                dataToStore[cleanKey] = [];
            }
            dataToStore[cleanKey].push(value);
        } else {
            dataToStore[key] = value;
        }
    });
    
    // Explicit handling for crewType checkboxes
    const crewTypeCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="crewType"]');
    dataToStore.crewTypeValues = [];
    crewTypeCheckboxes.forEach(cb => {
        if (cb.checked) {
           (dataToStore.crewTypeValues as string[]).push(cb.value);
        }
    });

    const photoPreviewImage = document.getElementById('photoPreview') as HTMLImageElement | null;
    if (photoPreviewImage && photoPreviewImage.src && photoPreviewImage.src !== '#' && !photoPreviewImage.classList.contains('hidden')) {
        dataToStore.photoDataUrl = photoPreviewImage.src;
    } else {
        dataToStore.photoDataUrl = null;
    }

    const childrenData: { name: string, dob: string }[] = [];
    document.querySelectorAll<HTMLElement>('#childrenContainer .child-entry').forEach(entry => {
        const nameInput = entry.querySelector('input[name="childName[]"]') as HTMLInputElement | null;
        const dobInput = entry.querySelector('input[name="childDob[]"]') as HTMLInputElement | null;
        childrenData.push({
            name: nameInput ? nameInput.value : '',
            dob: dobInput ? dobInput.value : ''
        });
    });
    dataToStore.children = childrenData;
    
    const ageDisplay = document.getElementById('ageDisplay') as HTMLSpanElement | null;
    if(ageDisplay) dataToStore.ageDisplay = ageDisplay.textContent;

    localStorage.setItem(STORAGE_KEY_MAIN_FORM, JSON.stringify(dataToStore));
    console.log('Form data saved:', dataToStore);
}

function loadMainFormData() {
    isLoadingData = true; // Set flag
    const applicationForm = document.getElementById('applicationForm') as HTMLFormElement | null;
    if (!applicationForm) {
        isLoadingData = false; // Reset flag
        return;
    }

    const savedDataString = localStorage.getItem(STORAGE_KEY_MAIN_FORM);
    if (!savedDataString) {
        console.log('No saved data found for main form.');
        isLoadingData = false; // Reset flag
        return;
    }

    const data: { [key: string]: any } = JSON.parse(savedDataString);
    console.log('Loading main form data:', data);

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            if (key === 'photoDataUrl') {
                const photoPreviewImage = document.getElementById('photoPreview') as HTMLImageElement | null;
                const photoPlaceholder = document.getElementById('photoPlaceholder') as HTMLDivElement | null;
                if (photoPreviewImage && photoPlaceholder && data.photoDataUrl) {
                    photoPreviewImage.src = data.photoDataUrl;
                    photoPreviewImage.classList.remove('hidden');
                    photoPlaceholder.classList.add('hidden');
                } else if (photoPreviewImage && photoPlaceholder) {
                    photoPreviewImage.src = '#';
                    photoPreviewImage.classList.add('hidden');
                    photoPlaceholder.classList.remove('hidden');
                }
                continue;
            }
            if (key === 'children') continue; 
            if (key === 'ageDisplay') {
                 const ageDisplay = document.getElementById('ageDisplay') as HTMLSpanElement | null;
                 if(ageDisplay && data.ageDisplay) ageDisplay.textContent = data.ageDisplay;
                continue;
            }
            if (key === 'crewTypeValues') {
                const crewTypeCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="crewType"]');
                crewTypeCheckboxes.forEach(cb => {
                    cb.checked = data.crewTypeValues ? data.crewTypeValues.includes(cb.value) : false;
                });
                continue;
            }

            const element = applicationForm.elements.namedItem(key) as any;
            if (element) {
                if (element instanceof RadioNodeList) {
                    element.forEach((radio: HTMLInputElement) => {
                        if (radio.value === data[key]) {
                            radio.checked = true;
                        }
                    });
                } else if (element.type === 'checkbox') {
                    // This handles single checkboxes that were saved as boolean, or parts of groups saved as arrays
                     if (typeof data[key] === 'boolean') {
                         element.checked = data[key];
                    } else if (Array.isArray(data[key]) && data[key].includes(element.value)) {
                         element.checked = true;
                    } else {
                        element.checked = false; // Ensure unchecking if not found
                    }
                } else if (element.tagName === 'SELECT' && element.multiple) {
                     for (let i = 0; i < element.options.length; i++) {
                        element.options[i].selected = data[key] ? data[key].includes(element.options[i].value) : false;
                    }
                }
                else {
                    element.value = data[key] !== null && data[key] !== undefined ? data[key] : '';
                }

                if (element.id === 'dob') {
                    const dobInput = document.getElementById('dob') as HTMLInputElement | null;
                    const ageDisplay = document.getElementById('ageDisplay') as HTMLSpanElement | null;
                    const ageInputHidden = document.getElementById('age') as HTMLInputElement | null;
                    calculateAge(dobInput, ageDisplay, ageInputHidden); 
                }
                if (element.id === 'maritalStatus') {
                    const otherMaritalStatusInput = document.getElementById('otherMaritalStatus') as HTMLInputElement | null;
                    if (otherMaritalStatusInput) {
                        const showOther = element.value === 'Other';
                        otherMaritalStatusInput.classList.toggle('hidden', !showOther);
                        otherMaritalStatusInput.required = showOther;
                        if (!showOther) otherMaritalStatusInput.value = '';
                    }
                }
                if (element.id === 'emergencyRelation') {
                    const otherEmergencyRelationInput = document.getElementById('otherEmergencyRelation') as HTMLInputElement | null;
                    if (otherEmergencyRelationInput) {
                        const showOther = element.value === 'Other';
                        otherEmergencyRelationInput.classList.toggle('hidden', !showOther);
                        otherEmergencyRelationInput.required = showOther;
                        if (!showOther) otherEmergencyRelationInput.value = '';
                    }
                }
            }
        }
    }
    
    const childTemplate = document.getElementById('childTemplate') as HTMLTemplateElement | null;
    const childrenContainer = document.getElementById('childrenContainer');
    const addChildButton = document.getElementById('addChildButton');
    if (childrenContainer) childrenContainer.innerHTML = ''; 
    
    if (data.children && Array.isArray(data.children)) {
        data.children.forEach((child: { name: string, dob: string }) => {
            addChildEntry(childTemplate, childrenContainer, addChildButton, child);
        });
    }
    updateAddChildButtonState(childrenContainer, addChildButton);
    isLoadingData = false; // Reset flag at the end
    console.log('Finished loading main form data.');
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', () => {
    const applicationForm = document.getElementById('applicationForm') as HTMLFormElement | null;
    const dateAppliedDisplay = document.getElementById('dateAppliedDisplay');
    const dobInput = document.getElementById('dob') as HTMLInputElement | null;
    const ageDisplay = document.getElementById('ageDisplay') as HTMLSpanElement | null;
    const ageInputHidden = document.getElementById('age') as HTMLInputElement | null;
    const maritalStatusSelect = document.getElementById('maritalStatus') as HTMLSelectElement | null;
    const otherMaritalStatusInput = document.getElementById('otherMaritalStatus') as HTMLInputElement | null;
    const childrenContainer = document.getElementById('childrenContainer');
    const childTemplate = document.getElementById('childTemplate') as HTMLTemplateElement | null;
    const addChildButton = document.getElementById('addChildButton');
    const emergencyRelationSelect = document.getElementById('emergencyRelation') as HTMLSelectElement | null;
    const otherEmergencyRelationInput = document.getElementById('otherEmergencyRelation') as HTMLInputElement | null;
    const photoUploadInput = document.getElementById('photoUpload') as HTMLInputElement | null;
    const photoPreviewImage = document.getElementById('photoPreview') as HTMLImageElement | null;
    const photoPlaceholder = document.getElementById('photoPlaceholder') as HTMLDivElement | null;
    const nextPageButton = document.getElementById('nextPageButton');

    loadMainFormData(); // Load data first

    // Set Date Applied
    if (dateAppliedDisplay && !dateAppliedDisplay.textContent && (!localStorage.getItem(STORAGE_KEY_MAIN_FORM) || !JSON.parse(localStorage.getItem(STORAGE_KEY_MAIN_FORM) as string).dateAppliedDisplayContent) ) { 
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        dateAppliedDisplay.textContent = formattedDateTime;
        // No need to save this to localStorage, it's generated on load if not present
    }


    // Add change event listener for DOB input to calculate age
    if (dobInput) {
        dobInput.addEventListener('change', () => {
            calculateAge(dobInput, ageDisplay, ageInputHidden);
            saveMainFormData(); 
        });
        // If dobInput has a value after loading, ensure age is calculated (already handled in loadMainFormData)
         if (dobInput.value && ageDisplay && !ageDisplay.textContent) { // Recalculate if not already displayed by load
             calculateAge(dobInput, ageDisplay, ageInputHidden);
        }
    }
    
    if (maritalStatusSelect && otherMaritalStatusInput) {
        maritalStatusSelect.addEventListener('change', () => {
            const showOther = maritalStatusSelect.value === 'Other';
            otherMaritalStatusInput.classList.toggle('hidden', !showOther);
            otherMaritalStatusInput.required = showOther;
            if (!showOther) otherMaritalStatusInput.value = '';
            saveMainFormData();
        });
        // Initial state set by loadMainFormData
    }

    if (addChildButton && childTemplate && childrenContainer) {
        addChildButton.addEventListener('click', () => {
            addChildEntry(childTemplate, childrenContainer, addChildButton);
            saveMainFormData();
        });
    }
    updateAddChildButtonState(childrenContainer, addChildButton); 

    if (emergencyRelationSelect && otherEmergencyRelationInput) {
        emergencyRelationSelect.addEventListener('change', () => {
            const showOther = emergencyRelationSelect.value === 'Other';
            otherEmergencyRelationInput.classList.toggle('hidden', !showOther);
            otherEmergencyRelationInput.required = showOther;
            if (!showOther) otherEmergencyRelationInput.value = '';
            saveMainFormData();
        });
         // Initial state set by loadMainFormData
    }

    if (photoUploadInput && photoPreviewImage && photoPlaceholder) {
        photoUploadInput.addEventListener('change', (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (files && files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target && e.target.result) {
                        photoPreviewImage.src = e.target.result as string;
                        photoPreviewImage.classList.remove('hidden');
                        photoPlaceholder.classList.add('hidden');
                        saveMainFormData(); 
                    }
                };
                reader.readAsDataURL(files[0]);
            }
        });
    }

    // Attach general form listeners after individual setup
    if (applicationForm) {
        applicationForm.addEventListener('input', saveMainFormData);
        applicationForm.addEventListener('change', saveMainFormData); 
    }

    if (nextPageButton && applicationForm) {
        nextPageButton.addEventListener('click', (event) => {
            event.preventDefault(); 
            
            if (dobInput) calculateAge(dobInput, ageDisplay, ageInputHidden); // Ensure age is current

            if (!applicationForm.checkValidity()) {
                applicationForm.reportValidity();
                return; 
            }
            
            saveMainFormData(); 
            console.log('Next Page button clicked. Form is valid. Navigating to camiip2.html');
            window.location.href = 'camiip2.html';
        });
    } else {
        if (!nextPageButton) console.warn('Next Page button not found.');
        if (!applicationForm) console.warn('Application form element not found.');
    }
});
