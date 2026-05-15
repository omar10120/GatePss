/**
 * Translates known English API / validation error messages to Arabic.
 * Used for dynamic messages returned from the server (e.g. Sohar Port API).
 */

const SOHAR_PHRASE_MAP: Record<string, string> = {
    'The request is invalid.': 'الطلب غير صالح.',
    ' Details: ': ' التفاصيل: ',
    'An error has occurred.': 'حدث خطأ.',
    'Failed to create gate pass': 'فشل إنشاء تصريح الدخول',
    'Failed to submit to Sohar Port system': 'فشل الإرسال إلى نظام ميناء صحار',
    'Integration Error': 'خطأ في التكامل',
    'Request number is required': 'رقم الطلب مطلوب',
    'Request not found': 'الطلب غير موجود',
    'Failed to check request status': 'فشل التحقق من حالة الطلب',
    'Other documents filename is required': 'اسم ملف المستندات الأخرى مطلوب',
    'Other documents attachment is required': 'مرفق المستندات الأخرى مطلوب',
    'Other documents(2) filename is required': 'اسم ملف المستندات الأخرى (٢) مطلوب',
    'Other documents attachment(2) is required': 'مرفق المستندات الأخرى (٢) مطلوب',
    'other_documents: Other documents filename is required': 'other_documents: اسم ملف المستندات الأخرى مطلوب',
    'other_attachment: Other documents attachment is required': 'other_attachment: مرفق المستندات الأخرى مطلوب',
    'other_documents2: Other documents(2) filename is required': 'other_documents2: اسم ملف المستندات الأخرى (٢) مطلوب',
    'other_attachment2: Other documents attachment(2) is required': 'other_attachment2: مرفق المستندات الأخرى (٢) مطلوب',
};

const FIELD_LABEL_MAP: Record<string, string> = {
    other_documents: 'المستندات الأخرى',
    other_attachment: 'مرفق المستندات الأخرى',
    other_documents2: 'المستندات الأخرى (٢)',
    other_attachment2: 'مرفق المستندات الأخرى (٢)',
};

/**
 * Replace longest phrases first to avoid partial-match issues.
 */
export function translateApiErrorMessage(message: string, locale: string): string {
    if (!message || locale !== 'ar') return message;

    let result = message;

    const sortedPhrases = Object.entries(SOHAR_PHRASE_MAP).sort(
        ([a], [b]) => b.length - a.length
    );

    for (const [english, arabic] of sortedPhrases) {
        result = result.split(english).join(arabic);
    }

    // Translate "fieldName: message" prefixes for Sohar model-state keys
    for (const [field, label] of Object.entries(FIELD_LABEL_MAP)) {
        result = result.replace(new RegExp(`\\b${field}:`, 'g'), `${label}:`);
        result = result.replace(new RegExp(`\\b${field}\\b(?!:)`, 'g'), label);
    }

    return result;
}
