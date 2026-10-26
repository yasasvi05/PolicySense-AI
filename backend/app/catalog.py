"""Static product catalogue per policy type.
TODO: move benefits/exclusions/documents into PostgreSQL tables once product data is available."""

CATALOG = {
    "Health": {
        "benefits": ["Cashless hospitalisation at network hospitals", "Day-care procedures covered", "Pre (30 days) and post (60 days) hospitalisation costs", "Annual health check-up", "Ambulance cover up to ₹3,000"],
        "exclusions": ["Cosmetic or plastic surgery (Section 8.1)", "Infertility and assisted reproduction", "Pre-existing conditions during first 24 months (Section 4.3)", "Treatment outside India"],
        "documents": ["Health_Secure_Plus_Terms.txt", "Policy_Schedule.pdf", "Claim_Form.pdf"],
    },
    "Motor": {
        "benefits": ["Own damage cover", "Third-party liability", "24x7 roadside assistance", "No-claim bonus up to 50%"],
        "exclusions": ["Drunk driving", "Driving without a valid licence", "Consequential loss", "Wear and tear"],
        "documents": ["Motor_Shield_Terms.txt", "Policy_Schedule.pdf"],
    },
    "Life": {
        "benefits": ["Death benefit to nominee", "Accidental death rider", "Terminal illness benefit", "Tax benefits under applicable law"],
        "exclusions": ["Suicide within first 12 months", "Death due to war or hazardous activities", "Non-disclosure of material facts"],
        "documents": ["Term_Life_Assure_Brochure.pdf", "Policy_Schedule.pdf"],
    },
}
