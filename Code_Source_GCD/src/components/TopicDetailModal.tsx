import React from 'react';
import { ThesisTopic, CartItem } from '../types';
import { X, User, Building2, Award, Calendar, CheckCircle2, Plus, Check } from 'lucide-react';

interface TopicDetailModalProps {
  topic: ThesisTopic | null;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (topic: ThesisTopic) => void;
  onRemoveFromCart: (topicId: string) => void;
  isMaxReached: boolean;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  onClose,
  cart,
  onAddToCart,
  onRemoveFromCart,
  isMaxReached
}) => {
  if (!topic) return null;

  const cartItem = cart.find((item) => item.topic.id === topic.id);
  const isInCart = Boolean(cartItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-indigo-700">{topic.domain}</span>
              <span>·</span>
              <span className="font-mono">{topic.code}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {topic.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Supervisor & Institution Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Direction de Recherche
              </div>
              <div className="font-semibold text-slate-900">{topic.director}</div>
              <div className="text-xs text-slate-500">{topic.directorTitle}</div>
              {topic.coDirector && (
                <div className="mt-1 text-xs text-slate-600">
                  <span className="font-medium">Co-direction : </span>
                  {topic.coDirector}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Établissement & Laboratoire
              </div>
              <div className="font-semibold text-slate-900">{topic.institution}</div>
              <div className="text-xs text-slate-500">{topic.laboratory}</div>
            </div>
          </div>

          {/* Abstract */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Description du Sujet</h4>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {topic.abstract}
            </p>
          </div>

          {/* Prerequisites */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Prérequis & Profil Requis</h4>
            <ul className="space-y-1.5">
              {topic.prerequisites.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Funding & Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Financement doctoral :</span>
              <span className="font-semibold text-emerald-700">{topic.funding}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Date limite de soumission :</span>
              <span className="font-mono font-medium text-slate-800">{topic.deadline}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>

          {isInCart ? (
            <button
              onClick={() => onRemoveFromCart(topic.id)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Retirer de mon panier</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onAddToCart(topic);
                onClose();
              }}
              disabled={isMaxReached}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isMaxReached
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter à mon panier</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
