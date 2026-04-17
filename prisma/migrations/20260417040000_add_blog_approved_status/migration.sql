-- Add APPROVED value to BlogStatus enum, placed between DRAFT and PUBLISHED
-- to reflect the approval gate in the blog workflow.
ALTER TYPE "BlogStatus" ADD VALUE IF NOT EXISTS 'APPROVED' BEFORE 'PUBLISHED';
