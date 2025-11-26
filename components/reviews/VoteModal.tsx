'use client';

import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaThumbsDown, FaTimes, FaCheck } from 'react-icons/fa';

export type VoteType = 'helpful' | 'unhelpful' | null;

interface VoteModalProps {
	open: boolean;
	title?: string;
	currentVote: VoteType;
	onClose: () => void;
	onSubmit: (choice: Exclude<VoteType, null>) => Promise<void> | void;
	submitLabel?: string;
}

export default function VoteModal({
	open,
	title = 'Vote',
	currentVote,
	onClose,
	onSubmit,
	submitLabel = 'Gửi vote'
}: VoteModalProps) {
	const [choice, setChoice] = useState<VoteType>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		// Reset lựa chọn khi mở/đóng
		if (open) {
			setChoice(null);
			setSubmitting(false);
		}
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
			{/* Overlay không blur (chỉ làm tối nền) */}
			<div
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all relative z-10">
				<div className="flex items-center justify-between mb-4">
					<h4 className="text-lg font-bold text-gray-900">{title}</h4>
					<button
						className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-all"
						onClick={onClose}
						aria-label="Đóng"
					>
						<FaTimes className="w-5 h-5" />
					</button>
				</div>

				<div className="grid grid-cols-2 gap-3 mb-6">
					<button
						type="button"
						disabled={currentVote === 'helpful'}
						onClick={() => setChoice('helpful')}
						className={`px-5 py-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center gap-2 ${
							currentVote === 'helpful'
								? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
								: choice === 'helpful'
								? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white border-teal-600 shadow-lg scale-105'
								: 'border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 hover:shadow-md'
						}`}
					>
						<FaThumbsUp className="w-8 h-8" />
						<span>Hữu ích</span>
					</button>
					<button
						type="button"
						disabled={currentVote === 'unhelpful'}
						onClick={() => setChoice('unhelpful')}
						className={`px-5 py-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center gap-2 ${
							currentVote === 'unhelpful'
								? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
								: choice === 'unhelpful'
								? 'bg-gradient-to-br from-gray-600 to-gray-700 text-white border-gray-700 shadow-lg scale-105'
								: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
						}`}
					>
						<FaThumbsDown className="w-8 h-8" />
						<span>Không hữu ích</span>
					</button>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
						onClick={onClose}
					>
						Hủy
					</button>
					<button
						type="button"
						disabled={submitting || !choice}
						className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
							(submitting || !choice)
								? 'bg-gray-200 text-gray-400 cursor-not-allowed'
								: 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
						}`}
						onClick={async () => {
							if (!choice || submitting) return;
							try {
								setSubmitting(true);
								await onSubmit(choice as Exclude<VoteType, null>);
							} finally {
								setSubmitting(false);
							}
						}}
					>
						<FaCheck className="w-4 h-4" />
						{submitLabel}
					</button>
				</div>
			</div>
		</div>
	);
}


