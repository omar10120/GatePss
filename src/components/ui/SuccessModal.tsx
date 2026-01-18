'use client';

interface SuccessModalProps {
    message: string;
    onClose: () => void;
}

export default function SuccessModal({ message, onClose }: SuccessModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
                {/* Illustration placeholder - you can replace with actual illustration */}
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{message}</h3>
                
                <button
                    onClick={onClose}
                    className="btn btn-primary w-full"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

