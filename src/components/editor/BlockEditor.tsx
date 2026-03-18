'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { BlockData, BlockType, getDefaultBlockData } from './types';
import BlockWrapper from './BlockWrapper';
import AddBlockButton from './AddBlockButton';
import HeadingBlock from './blocks/HeadingBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import ImageBlock from './blocks/ImageBlock';
import VideoBlock from './blocks/VideoBlock';
import HtmlBlock from './blocks/HtmlBlock';
import QuoteBlock from './blocks/QuoteBlock';
import ListBlock from './blocks/ListBlock';
import DividerBlock from './blocks/DividerBlock';
import ButtonBlock from './blocks/ButtonBlock';
import SpacerBlock from './blocks/SpacerBlock';

interface BlockEditorProps {
  blocks: BlockData[];
  onChange: (blocks: BlockData[]) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function BlockEditor({ blocks: externalBlocks, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<BlockData[]>(externalBlocks);

  // Sync external blocks to internal state when they change
  useEffect(() => {
    setBlocks(externalBlocks);
  }, [externalBlocks]);

  const updateBlocks = useCallback(
    (newBlocks: BlockData[]) => {
      // Recalculate order
      const ordered = newBlocks.map((block, index) => ({
        ...block,
        order: index,
      }));
      setBlocks(ordered);
      onChange(ordered);
    },
    [onChange],
  );

  const handleAddBlock = useCallback(
    (type: BlockType, insertAtIndex: number) => {
      const newBlock: BlockData = {
        id: generateId(),
        type,
        data: getDefaultBlockData(type),
        order: insertAtIndex,
      };
      const newBlocks = [...blocks];
      newBlocks.splice(insertAtIndex, 0, newBlock);
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks],
  );

  const handleUpdateBlock = useCallback(
    (id: string, data: Record<string, any>) => {
      const newBlocks = blocks.map((block) =>
        block.id === id ? { ...block, data } : block,
      );
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks],
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      const newBlocks = blocks.filter((block) => block.id !== id);
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks],
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index <= 0) return;
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks],
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index === -1 || index >= blocks.length - 1) return;
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index === -1) return;
      const original = blocks[index];
      const duplicate: BlockData = {
        ...original,
        id: generateId(),
        data: { ...original.data },
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, duplicate);
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks],
  );

  const renderBlock = (block: BlockData) => {
    const commonProps = {
      onUpdate: (data: Record<string, any>) => handleUpdateBlock(block.id, data),
    };

    switch (block.type) {
      case 'heading':
        return <HeadingBlock data={block.data as any} {...commonProps} />;
      case 'paragraph':
        return <ParagraphBlock data={block.data as any} {...commonProps} />;
      case 'image':
        return <ImageBlock data={block.data as any} {...commonProps} />;
      case 'video':
        return <VideoBlock data={block.data as any} {...commonProps} />;
      case 'html':
        return <HtmlBlock data={block.data as any} {...commonProps} />;
      case 'quote':
        return <QuoteBlock data={block.data as any} {...commonProps} />;
      case 'list':
        return <ListBlock data={block.data as any} {...commonProps} />;
      case 'divider':
        return <DividerBlock data={block.data as any} {...commonProps} />;
      case 'button':
        return <ButtonBlock data={block.data as any} {...commonProps} />;
      case 'spacer':
        return <SpacerBlock data={block.data as any} {...commonProps} />;
      default:
        return (
          <Typography color="error" variant="body2">
            Unknown block type: {block.type}
          </Typography>
        );
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        minHeight: 200,
        backgroundColor: 'background.default',
      }}
    >
      {/* Add block at the top */}
      <AddBlockButton onAdd={(type) => handleAddBlock(type, 0)} />

      {blocks.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6" gutterBottom>
            No blocks yet
          </Typography>
          <Typography variant="body2">
            Click the + button above to add your first content block.
          </Typography>
        </Box>
      )}

      {blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <BlockWrapper
            block={block}
            index={index}
            totalBlocks={blocks.length}
            onUpdate={handleUpdateBlock}
            onDelete={handleDeleteBlock}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDuplicate={handleDuplicate}
          >
            {renderBlock(block)}
          </BlockWrapper>

          {/* Add block between blocks and at the bottom */}
          <AddBlockButton onAdd={(type) => handleAddBlock(type, index + 1)} />
        </React.Fragment>
      ))}
    </Paper>
  );
}
