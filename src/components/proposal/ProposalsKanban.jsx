import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Trash2, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const COLUMNS = [
  { id: "draft", label: "Черновик", color: "bg-gray-100", headerColor: "bg-gray-200 text-gray-700" },
  { id: "sent", label: "Отправлено", color: "bg-gray-50", headerColor: "bg-gray-100 text-gray-700" },
  { id: "accepted", label: "Принято", color: "bg-green-50", headerColor: "bg-green-100 text-green-700" },
  { id: "rejected", label: "Отклонено", color: "bg-red-50", headerColor: "bg-red-100 text-red-700" },
];

export default function ProposalsKanban({ proposals, onDelete, onRename, onProposalsChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const grouped = {};
  COLUMNS.forEach(c => { grouped[c.id] = proposals.filter(p => (p.status || "draft") === c.id); });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const proposal = proposals.find(p => p.id === draggableId);
    if (!proposal || proposal.status === newStatus) return;

    // Optimistically update UI
    const updated = proposals.map(p => p.id === draggableId ? { ...p, status: newStatus } : p);
    onProposalsChange(updated);

    await base44.entities.Proposal.update(draggableId, { status: newStatus });
  };

  const handleRenameStart = (p) => { setEditingId(p.id); setEditingTitle(p.title); };
  const handleRenameSave = async (id) => {
    if (!editingTitle.trim()) return;
    await onRename(id, editingTitle.trim());
    setEditingId(null);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-64">
            <div className={`rounded-t-xl px-3 py-2 flex items-center justify-between ${col.headerColor}`}>
              <span className="font-semibold text-sm">{col.label}</span>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/60">
                {grouped[col.id]?.length || 0}
              </span>
            </div>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] rounded-b-xl p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? col.color : "bg-gray-50"}`}
                >
                  {grouped[col.id].map((p, index) => (
                    <Draggable key={p.id} draggableId={p.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-lg shadow-sm border p-3 transition-shadow ${snapshot.isDragging ? "shadow-lg rotate-1" : "hover:shadow-md"}`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FileText className="w-3 h-3 text-gray-900" />
                            </div>
                            <div className="flex gap-0.5 ml-auto">
                              <Link to={createPageUrl(`ProposalEditor?id=${p.id}`)}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(p.id)}>
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                          </div>

                          {editingId === p.id ? (
                            <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={e => setEditingTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleRenameSave(p.id); if (e.key === "Escape") setEditingId(null); }}
                                className="text-xs font-medium border border-gray-400 rounded px-1.5 py-0.5 outline-none w-full"
                              />
                              <button onClick={() => handleRenameSave(p.id)}><Check className="w-3 h-3 text-green-600" /></button>
                              <button onClick={() => setEditingId(null)}><X className="w-3 h-3 text-gray-400" /></button>
                            </div>
                          ) : (
                            <p
                              className="text-xs font-semibold text-gray-800 cursor-pointer hover:text-gray-900 group flex items-center gap-0.5"
                              onClick={() => handleRenameStart(p)}
                            >
                              {p.title}
                              <Edit className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </p>
                          )}

                          <div className="mt-1.5 text-xs text-gray-400 space-y-0.5">
                            {p.client_company && <p className="truncate">{p.client_company}</p>}
                            {p.client_name && <p className="truncate">{p.client_name}</p>}
                            <p>{format(new Date(p.created_date), "d MMM yyyy", { locale: ru })}</p>
                            {p.total_amount > 0 && (
                              <p className="font-medium text-gray-600">{p.total_amount.toLocaleString("ru-RU")} ₽</p>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}