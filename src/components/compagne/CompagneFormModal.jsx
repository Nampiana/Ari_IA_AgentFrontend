import React, { useState } from "react";

const getInitialFormData = (selectedCompagne) => ({
    nomCompagne: selectedCompagne?.nomCompagne || "",
    numero: selectedCompagne?.numero || "",
    script: selectedCompagne?.script || "",
    id_ia: selectedCompagne?.id_ia?._id || selectedCompagne?.id_ia || "",
    fiche: selectedCompagne?.fiche?._id || selectedCompagne?.fiche || "",
    active: selectedCompagne?.active ?? 1,
});

export default function CompagneFormModal({
    open,
    onClose,
    onSubmit,
    selectedCompagne,
    agents = [],
    lists = [],
}) {
    const [formData, setFormData] = useState(() => getInitialFormData(selectedCompagne));

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === "active" ? Number(value) : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            ...formData,
            id_ia: formData.id_ia || null,
        });
    };

    return (
        <div className="agentModalOverlay" onClick={onClose}>
            <div className="agentModal" onClick={(e) => e.stopPropagation()}>
                <div className="agentModalHeader">
                    <h2>{selectedCompagne ? "Modifier la campagne" : "Créer une campagne"}</h2>
                    <button type="button" className="closeBtn" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="agentForm">
                    <div className="formGrid">
                        <div className="formGroup">
                            <label>Nom de la campagne</label>
                            <input
                                name="nomCompagne"
                                value={formData.nomCompagne}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="formGroup">
                            <label>Numéro</label>
                            <input
                                name="numero"
                                value={formData.numero}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="formGroup">
                        <label>Fiche (liste CSV)</label>

                        <select name="fiche" value={formData.fiche} onChange={handleChange}>
                            <option value="">Sélectionner une fiche</option>

                            {lists.map((list) => (
                            <option key={list._id} value={list._id}>
                                {list.nomFiche}
                            </option>
                            ))}
                        </select>
                        </div>

                        <div className="formGroup">
                            <label>Agent IA associé</label>
                            <select name="id_ia" value={formData.id_ia} onChange={handleChange}>
                                <option value="">Sélectionner un agent</option>
                                {agents.map((agent) => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.nomAgent || agent.companyName || "Agent sans nom"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="formGroup">
                            <label>Statut</label>
                            <select name="active" value={formData.active} onChange={handleChange}>
                                <option value={1}>Actif</option>
                                <option value={0}>Inactif</option>
                            </select>
                        </div>
                    </div>

                    <div className="formGroup full">
                        <label>Script</label>
                        <textarea
                            name="script"
                            value={formData.script}
                            onChange={handleChange}
                            rows="6"
                            required
                        />
                    </div>

                    {selectedCompagne?.scriptFinal && (
                        <div className="formGroup full">
                            <label>Aperçu du script final</label>
                            <textarea
                                value={selectedCompagne.scriptFinal}
                                readOnly
                                rows="8"
                            />
                        </div>
                    )}

                    <div className="agentModalActions">
                        <button type="button" className="btnGhost" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btnPrimary">
                            {selectedCompagne ? "Mettre à jour" : "Créer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}