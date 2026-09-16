STYLES = {

    "bold_dramatic": "Create a bold, dramatic YouTube thumbnail with high contrast, cinematic lighting, dark moody background, and powerful composition. The person's face should be prominent with a dramatic expression.",

    "clean_minimal": "Create a clean, minimal YouTube thumbnail with bright lighting, white/light background, modern professional aesthetic, plenty of whitespace, and sharp clean composition. The person should look approachable and professional.",

    "vibrant_energetic": "Create a vibrant, energetic YouTube thumbnail with colorful gradients, dynamic angles, eye-catching pop-art style colors, and energetic composition. The person should have an excited or engaging expression.",

    "neon_gaming": "Create a high-octane gaming YouTube thumbnail with neon cyber-punk lighting, glowing outlines, dark background, and intense action-packed composition. The subject should look focused, hyped, or highly expressive.",

    "tech_review": "Create a sleek tech review YouTube thumbnail with crisp studio lighting, subtle RGB accent lights in the background, sharp focus on the subject, and a modern, premium aesthetic. The person should look intrigued or analytical.",

    "warm_lifestyle": "Create a cozy vlog-style YouTube thumbnail with warm sun-drenched lighting, soft bokeh (blurred) background, natural earthy tones, and an inviting composition. The person should look relaxed, happy, and authentic.",

    "educational_documentary": "Create an intriguing documentary-style YouTube thumbnail with muted cinematic tones, subtle vignette, highly detailed textures, and a serious, mysterious atmosphere. The person should have a thoughtful or intense expression.",

    "finance_business": "Create a professional finance YouTube thumbnail with rich green and gold accents, subtle upward-trending charts or glowing abstract data in the background, and crisp corporate lighting. The person should look confident and trustworthy.",

    "beauty_glam": "Create a glamorous beauty YouTube thumbnail with soft diffused lighting, pastel or rose-gold background tones, subtle sparkle or shimmer accents, and a polished, elegant composition. The person should look radiant and confident, with flawless, well-lit skin.",

    "fitness_sports": "Create a high-energy fitness YouTube thumbnail with bright gym or outdoor lighting, bold red/orange/black color accents, sweat-and-motion detail, and a dynamic, powerful composition. The person should look determined, intense, or mid-action.",

    "comedy_reaction": "Create an exaggerated reaction-style YouTube thumbnail with punchy saturated colors, a zoomed-in close-up framing, comic-style emphasis (like subtle motion lines or a bright halo behind the subject), and a loud, attention-grabbing composition. The person should have an exaggerated shocked, laughing, or wide-eyed expression.",

    "travel_adventure": "Create an adventurous travel YouTube thumbnail with golden-hour natural lighting, a scenic outdoor backdrop (mountains, coastline, or cityscape), warm sunlit tones, and an expansive, wide-open composition. The person should look excited, curious, or awe-struck.",

    "food_cooking": "Create an appetizing food/cooking YouTube thumbnail with warm kitchen lighting, rich saturated food-forward colors, a close, inviting composition with the subject near the food, and a fresh, mouth-watering aesthetic. The person should look delighted or focused, mid-cooking or mid-taste.",

    "true_crime_mystery": "Create a dark, suspenseful true-crime YouTube thumbnail with low-key dramatic lighting, deep shadows, a desaturated or red-tinted color palette, and an unsettling, tense composition. The person should have a serious, grave, or investigative expression.",

    "motivational_selfhelp": "Create an inspiring motivational YouTube thumbnail with bright uplifting lighting, a clean sky or sunrise-toned background, bold confident framing, and an aspirational, larger-than-life composition. The person should look empowered, determined, and inspiring.",

    "music_concert": "Create an electrifying music/concert-style YouTube thumbnail with dramatic stage lighting, colorful spotlight beams or lens flares, a dark performance-venue background, and a high-impact, larger-than-life composition. The person should look passionate, expressive, or mid-performance.",

    "retro_vintage": "Create a nostalgic retro YouTube thumbnail with warm faded film-grain tones, a muted 70s/80s color palette (mustard, teal, burnt orange), subtle grain or scanline texture, and a playful vintage-poster composition. The person should have a cool, nostalgic, or playful expression.",

    "automotive_cars": "Create a sleek automotive YouTube thumbnail with dramatic low-angle studio lighting, glossy reflective surfaces, a dark garage or road backdrop, and a powerful, high-performance composition. The person should look confident and knowledgeable, positioned alongside or near the vehicle.",

    "scifi_fantasy": "Create an epic sci-fi/fantasy YouTube thumbnail with dramatic otherworldly lighting, glowing particle or energy effects, a surreal or futuristic backdrop, and an immersive, cinematic composition. The person should look awestruck, heroic, or intense.",

    "news_breaking": "Create an urgent breaking-news style YouTube thumbnail with stark high-contrast lighting, a bold red/blue accent color scheme, a serious newsroom-style backdrop, and a direct, attention-commanding composition. The person should have a serious, alert, or urgent expression.",
}

STYLE_ORDER = [
    "bold_dramatic",
    "clean_minimal",
    "vibrant_energetic",
    "neon_gaming",
    "tech_review",
    "warm_lifestyle",
    "educational_documentary",
    "finance_business",
    "beauty_glam",
    "fitness_sports",
    "comedy_reaction",
    "travel_adventure",
    "food_cooking",
    "true_crime_mystery",
    "motivational_selfhelp",
    "music_concert",
    "retro_vintage",
    "automotive_cars",
    "scifi_fantasy",
    "news_breaking",
]

MAIN_PROMPT = """System Prompt: "You are a expert thumbnail generator your only job is to Generate an ultra-high-quality,
cinematic video thumbnail. The image must be eye-catching, featuring hyper-vibrant colors, strong rim lighting, and high
contrast to stand out on mobile screens. The composition must feature a clear, dynamic main subject in the foreground.
Keep the background slightly blurred or simple to avoid visual clutter. Ensure there is clear 'negative space' (an uncluttered area) 
on either the left or right side of the image for future text\nConstraints : - Never ever ask any question in response just generate the 
thumbnail of the image user provided\n -You are a thumbnail image generator only takes the user_prompt and styles_prompt to understand
desire. 
"""