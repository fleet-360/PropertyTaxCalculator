'use client';

import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { ListData } from '../types';

interface ListBlockProps {
  data: ListData;
  onUpdate: (data: ListData) => void;
}

export default function ListBlock({ data, onUpdate }: ListBlockProps) {
  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    type: ListData['type'] | null,
  ) => {
    if (type) {
      onUpdate({ ...data, type });
    }
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...data.items];
    newItems[index] = value;
    onUpdate({ ...data, items: newItems });
  };

  const handleAddItem = () => {
    onUpdate({ ...data, items: [...data.items, ''] });
  };

  const handleDeleteItem = (index: number) => {
    if (data.items.length <= 1) return; // Keep at least one item
    const newItems = data.items.filter((_, i) => i !== index);
    onUpdate({ ...data, items: newItems });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...data.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onUpdate({ ...data, items: newItems });
  };

  return (
    <Box>
      {/* List type toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Type:
        </Typography>
        <ToggleButtonGroup
          value={data.type}
          exclusive
          onChange={handleTypeChange}
          size="small"
        >
          <ToggleButton value="unordered">
            <FormatListBulletedIcon fontSize="small" sx={{ mr: 0.5 }} />
            Unordered
          </ToggleButton>
          <ToggleButton value="ordered">
            <FormatListNumberedIcon fontSize="small" sx={{ mr: 0.5 }} />
            Ordered
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* List items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {data.items.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                minWidth: 24,
                textAlign: 'right',
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              {data.type === 'ordered' ? `${index + 1}.` : '\u2022'}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={`Item ${index + 1}`}
              sx={{ '& .MuiInputBase-input': { py: 0.75 } }}
            />
            <Tooltip title="Move Up">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveItem(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move Down">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveItem(index, 'down')}
                  disabled={index === data.items.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete Item">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteItem(index)}
                  disabled={data.items.length <= 1}
                  sx={{ color: 'error.light' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}
      </Box>

      {/* Add item button */}
      <Button
        startIcon={<AddIcon />}
        onClick={handleAddItem}
        size="small"
        sx={{ mt: 1.5 }}
      >
        Add Item
      </Button>
    </Box>
  );
}
