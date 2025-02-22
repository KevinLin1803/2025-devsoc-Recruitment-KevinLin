import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface desiredRecipe {
  name: string
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const ingredients: Map<string, ingredient> = new Map();
const recipes: Map<string, recipe> = new Map();

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {

  // Remove leading/trailing white spaces
  var cleaned: string = recipeName.trim()

  // Replacing hyphens and underscores with white spaces
  cleaned = cleaned.replace( /[-_]/g, ' ')

  // Ensuring only one white space between words
  cleaned = cleaned.replace( /\s+/g, ' ')

  // Any non-letter or whitespace character removed
  cleaned = cleaned.replace(/[^a-zA-Z ]/g, '')

  // if the string is less than 0 characters then return null
  if (cleaned.length == 0) return null

  // Convert to title case
  cleaned = cleaned.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );

  return cleaned 
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {

  const entry: cookbookEntry = req.body

  // check for unique name
  if (ingredients.has(entry.name) || recipes.has(entry.name)) return res.status(400).send("Not a unique name!")

  //Adding to recipes or ingredients
  if (entry.type === 'ingredient') {
    if ((entry as ingredient).cookTime < 0) return res.status(400).send("Invalid cooking time")
    
    ingredients.set(entry.name, entry as ingredient)

  } else if (entry.type === 'recipe') {
    const dups : Set <string> = new Set()

    for (const item of (entry as recipe).requiredItems) {
      if (dups.has(item.name)) return res.status(400).send("Invalid required item list: Has duplicates")
      else if (item.quantity < 1) return res.status(400).send("Quantity must be at least one")
      else dups.add(item.name)

      recipes.set(entry.name, entry as recipe)
    }
  } else {
    return res.status(400).send("Not an ingredient or recipe")
  }

  res.status(200).send("Successful :)")
});

// Additional test cases for task 2:
  // casing? eg: beef vs Beef (is this considered unique?)
  // quantity > 0
  // - if quantity in required items is less than 1

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name

const extractIngredients = (requiredItems: requiredItem[]): Map<string, number> | null => {

  const ingredientMap : Map<string, number> = new Map()

  for (const item of requiredItems) {
    if (recipes.has(item.name)) {
      const innerIngredients : Map<string, number> = extractIngredients(recipes.get(item.name).requiredItems)
      // We'll see if there's a better way to do this
      if (innerIngredients == null) {
        return null
      }

      // Collapses the ingredient list on every level of recursion
      for (let [name, quantity] of innerIngredients) {
        if (ingredientMap.has(name)) {
          ingredientMap.set(name, ingredientMap.get(name) + quantity * item.quantity)
        } else {
          ingredientMap.set(name, quantity * item.quantity)
        }
      }

    } else if (ingredients.has(item.name)) {
      ingredientMap.set(item.name, item.quantity)
    }

    else {
      // Invalid ingredient list
      return null
    }
  }

  return ingredientMap
}

const calcTime = (requiredItems: Map<string, number>): number => {

  var time = 0
  for (let [name, quantity] of requiredItems) {
    time += quantity * ingredients.get(name).cookTime
  }

  return time
}

app.get("/summary", (req:Request, res:Request) => {

  const target: desiredRecipe = req.query

  if (!recipes.has(target.name)) return res.status(400).send("item not in recipes")
  
  const recipe: recipe = recipes.get(target.name)

  const ingredientList : Map<string, number> = extractIngredients(recipe.requiredItems)
  if (ingredientList == null) return res.status(400).send("invalid required item list")
  
  const cookTime : number = calcTime(ingredientList)

  res.status(200).json({
    "name": recipe.name,
    "cookTime": cookTime,
    "ingredients": Array.from(ingredientList, ([name, quantity]) => ({name, quantity}))
  })
});

// Additional cases:
// - case sensitivity on names? --> hopefully that's not a case :3. HMMMM maybe we're supposed to parse the handwriting
// I feel like we're supposed to parse the handwriting 

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
