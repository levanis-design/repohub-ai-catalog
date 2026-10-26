import copy
import importlib.util
import pathlib
import unittest

spec=importlib.util.spec_from_file_location('refresh',pathlib.Path(__file__).with_name('refresh-catalog.py'))
refresh=importlib.util.module_from_spec(spec);spec.loader.exec_module(refresh)

def project(repo='old/tool'):
 return dict(id='stable-saved-id',repo=repo,url='https://github.com/'+repo,name='Tool',category='Coding',summary='An original editorial summary.',review='README reviewed',reviewedAt='2026-09-01',stars=19,license='Restricted license',featured=True,experimental=False,sources=[])

def facts(repo='old/tool'):
 return dict(repo=repo,stars=45,forks=8,isFork=False,archived=True,disabled=False,updated='2026-10-25',license=None,description='A new marketing description.')

def row(repo='old/tool'):
 return dict(name='Tool',url='https://github.com/'+repo,categorySlug='plugins',resource=False,resourceType='12K')

class RefreshTests(unittest.TestCase):
 def merge(self,data,rows,metadata):return refresh.merge(data,rows,metadata,'2026-10-25','revision','2026-10-26T00:00:00Z')

 def test_refresh_preserves_editorial_and_review_evidence(self):
  data={'projects':[project()]}
  result=self.merge(data,[row()],{'old/tool':facts()})
  p=result['projects'][0]
  self.assertEqual(p['id'],'stable-saved-id')
  self.assertEqual(p['summary'],'An original editorial summary.')
  self.assertEqual(p['reviewedAt'],'2026-09-01')
  self.assertEqual(p['license'],'Restricted license')
  self.assertEqual(p['stars'],45)
  self.assertTrue(p['archived'])
  self.assertEqual(p['metadataCheckedAt'],'2026-10-25')
  self.assertEqual(data['projects'][0]['stars'],19)

 def test_renames_preserve_saved_id_and_canonical_link(self):
  result=self.merge({'projects':[project()]},[row()],{'old/tool':facts('new/tool'),'new/tool':facts('new/tool')})
  self.assertEqual(len(result['projects']),1)
  self.assertEqual(result['projects'][0]['repo'],'new/tool')
  self.assertEqual(result['projects'][0]['id'],'stable-saved-id')
  self.assertIn('old/tool',result['projects'][0]['aliases'])

 def test_unavailable_repo_retains_previous_facts(self):
  result=self.merge({'projects':[project()]},[row()],{'old/tool':None})
  self.assertEqual(result['projects'][0]['stars'],19)
  self.assertEqual(result['projects'][0]['metadataStatus'],'unavailable')
  self.assertNotIn('metadataCheckedAt',result['projects'][0])

 def test_favorites_removed_upstream_are_not_deleted(self):
  result=self.merge({'projects':[project()]},[],{'old/tool':facts()})
  self.assertEqual(len(result['projects']),1)
  self.assertFalse(result['projects'][0]['upstreamListed'])

 def test_guides_are_distinct_from_repositories(self):
  guide={'name':'Guide','url':'https://github.com/old/tool/blob/main/guide.md','categorySlug':'resources','resource':True,'resourceType':'Guide'}
  result=self.merge({'projects':[project()]},[row(),guide],{'old/tool':facts()})
  self.assertEqual(len(result['projects']),2)
  self.assertTrue(result['projects'][1]['isResource'])
  self.assertIsNone(result['projects'][1]['stars'])
  self.assertEqual(result['upstream']['coveredEntries'],2)

 def test_aliases_collapse_without_losing_source_coverage(self):
  result=self.merge({'projects':[project()]},[row(),row('new/tool')],{'old/tool':facts('new/tool'),'new/tool':facts('new/tool')})
  self.assertEqual(len(result['projects']),1)
  self.assertEqual(result['upstream']['coveredEntries'],2)

 def test_new_imports_never_claim_readme_or_installation_testing(self):
  result=self.merge({'projects':[]},[row()],{'old/tool':facts()})
  self.assertEqual(result['projects'][0]['review'],'Metadata reviewed')
  self.assertEqual(result['projects'][0]['platforms'],['See docs'])
  self.assertIn('not been independently verified',result['projects'][0]['limitation'])

 def test_emoji_is_removed_from_imported_copy(self):
  self.assertEqual(refresh.clean('\U0001f680 Fast \u2b50 tools \u2705'),'Fast tools')

 def test_unexpected_upstream_format_stops_instead_of_empty_import(self):
  with self.assertRaises(RuntimeError):refresh.parse_upstream('# Empty',{'categories':[]})

if __name__=='__main__':unittest.main()
