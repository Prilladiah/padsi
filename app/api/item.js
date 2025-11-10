// Simulasi database dengan array
let items = [
  {
    id: 1,
    name: "teh",
    supplier: "pucuk",
    quantity: 10,
    unit: "kg",
    price: 1000000,
    date: "07/11/2025",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      res.status(200).json(items);
      break;
      
    case 'POST':
      try {
        const newItem = {
          id: Date.now(),
          ...req.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        items.push(newItem);
        res.status(201).json(newItem);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
      }
      break;
      
    case 'PUT':
      try {
        const index = items.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
          return res.status(404).json({ error: 'Item not found' });
        }
        
        items[index] = {
          ...items[index],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        res.status(200).json(items[index]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
      }
      break;
      
    case 'DELETE':
      try {
        const index = items.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
          return res.status(404).json({ error: 'Item not found' });
        }
        
        items.splice(index, 1);
        res.status(200).json({ message: 'Item deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}