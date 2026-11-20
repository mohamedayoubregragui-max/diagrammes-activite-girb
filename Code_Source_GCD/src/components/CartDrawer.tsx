import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, ArrowUp, ArrowDown, ShoppingBag, ShieldCheck, CheckCircle } from 'lucide-react';
import { MAX_CART_ITEMS } from '../services/storage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (topicId: string) => void;
  onReorder: (newItems: CartItem[]) => void;
  onClear: () => void;
  onValidate: () => void;
  onExploreTopics?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onRemove,
  onReorder,
  onClear,
  onValidate,
  onExploreTopics
}) => {
  if (!isOpen) return null;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const items = [...cart];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    onReorder(items);
  };

  const moveDown = (index: number) => {
    if (index === cart.length - 1) return;
    const items = [...cart];
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    onReorder(items);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Mon Panier de Sujets
              </h2>
              <p className="text-xs text-slate-500">
                Choix provisoire en mémoire locale
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {cart.length} / {MAX_CART_ITEMS}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner from GCD matrix */}
        <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200/50 text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold">Règle Doctorale :</span> Maximum de 3 sujets classés par ordre de priorité. La validation officielle nécessitera votre <strong>e-mail académique</strong>.
        </div>

        {/* Content list */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-700">Votre panier est vide</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Explorez le catalogue de recherche et ajoutez jusqu'à 3 sujets de thèse sans avoir besoin de créer un compte à ce stade.
              </p>
              {onExploreTopics && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreTopics();
                  }}
                  className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Explorer les sujets →
                </button>
              )}
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={item.topic.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex flex-col gap-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-indigo-600 text-white">
                      Choix #{item.priority}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.topic.code}
                    </span>
                  </div>

                  {/* Reordering and remove actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Monter la priorité"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === cart.length - 1}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Descendre la priorité"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(item.topic.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer ml-1"
                      title="Retirer ce sujet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-900 line-clamp-2">
                  {item.topic.title}
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  Directeur : {item.topic.director}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Sujets sélectionnés :</span>
              <span className="font-mono font-semibold text-slate-900">
                {cart.length} / {MAX_CART_ITEMS}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onValidate();
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Valider ma sélection →</span>
            </button>

            <button
              onClick={onClear}
              className="w-full text-center text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              Vider le panier local
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
